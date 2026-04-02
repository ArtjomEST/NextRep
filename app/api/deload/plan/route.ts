import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import {
  deloadRecommendations,
  userProfiles,
  workouts,
  workoutExercises,
  workoutSets,
  exercises,
} from '@/lib/db/schema';
import { eq, and, gte, desc } from 'drizzle-orm';
import { authenticateRequest } from '@/lib/auth/helpers';
import { computeIsPro } from '@/lib/pro/helpers';
import { openaiChatCompletion } from '@/lib/ai/openai';

interface PresetExercise {
  name: string;
  sets: number;
  targetReps: number;
  targetWeight: number;
}

interface AiPresetData {
  name: string;
  exercises: PresetExercise[];
}

interface AiResponse {
  explanation: string;
  preset: AiPresetData;
}

function isAiResponse(v: unknown): v is AiResponse {
  if (typeof v !== 'object' || v === null) return false;
  const obj = v as Record<string, unknown>;
  return (
    typeof obj.explanation === 'string' &&
    typeof obj.preset === 'object' &&
    obj.preset !== null &&
    Array.isArray((obj.preset as Record<string, unknown>).exercises)
  );
}

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const db = getDb();

    // PRO gate
    const [proProfile] = await db
      .select({
        proExpiresAt: userProfiles.proExpiresAt,
        trialEndsAt: userProfiles.trialEndsAt,
        goal: userProfiles.goal,
        experienceLevel: userProfiles.experienceLevel,
      })
      .from(userProfiles)
      .where(eq(userProfiles.userId, auth.userId))
      .limit(1);

    if (!computeIsPro(proProfile ?? {})) {
      return NextResponse.json({ error: 'PRO subscription required' }, { status: 403 });
    }

    // Find latest deload recommendation row
    const [rec] = await db
      .select()
      .from(deloadRecommendations)
      .where(eq(deloadRecommendations.userId, auth.userId))
      .orderBy(desc(deloadRecommendations.createdAt))
      .limit(1);

    if (!rec) {
      return NextResponse.json({ error: 'No deload analysis found. Check status first.' }, { status: 404 });
    }

    // Return cached if already generated
    if (rec.aiExplanation && rec.aiPresetData) {
      return NextResponse.json({
        data: {
          explanation: rec.aiExplanation,
          preset: rec.aiPresetData as AiPresetData,
        },
      });
    }

    // Fetch last 14 days of exercise data
    const since = new Date();
    since.setUTCDate(since.getUTCDate() - 14);

    const recentSets = await db
      .select({
        exerciseName: exercises.name,
        weight: workoutSets.weight,
        reps: workoutSets.reps,
        workoutId: workouts.id,
      })
      .from(workoutSets)
      .innerJoin(workoutExercises, eq(workoutSets.workoutExerciseId, workoutExercises.id))
      .innerJoin(workouts, eq(workoutExercises.workoutId, workouts.id))
      .innerJoin(exercises, eq(workoutExercises.exerciseId, exercises.id))
      .where(
        and(
          eq(workouts.userId, auth.userId),
          gte(workouts.createdAt, since),
          eq(workoutSets.completed, true),
        ),
      )
      .orderBy(desc(workouts.createdAt));

    // Group sets by exercise: track total sets and max weight
    const exerciseMap = new Map<string, { sets: number; maxWeight: number }>();
    for (const row of recentSets) {
      const key = row.exerciseName;
      const existing = exerciseMap.get(key) ?? { sets: 0, maxWeight: 0 };
      existing.sets += 1;
      existing.maxWeight = Math.max(existing.maxWeight, Number(row.weight ?? 0));
      exerciseMap.set(key, existing);
    }

    // Sort by most sets (most frequent)
    const sortedExercises = Array.from(exerciseMap.entries())
      .sort((a, b) => b[1].sets - a[1].sets);

    const exerciseList = sortedExercises
      .map(([name, data]) => {
        const reps = recentSets
          .filter((r) => r.exerciseName === name && r.reps != null)
          .map((r) => r.reps as number);
        const avgReps = reps.length > 0 ? Math.round(reps.reduce((s, v) => s + v, 0) / reps.length) : 0;
        return `${name}: ${data.sets} sets × ${avgReps} reps @ ${data.maxWeight} kg`;
      })
      .join('\n');

    const signals = (rec.signals as string[]).join(', ');
    const weeklyVolumes = (rec.weeklyVolumes as { weekStart: string; volume: number }[])
      .map((w) => `${w.weekStart}: ${Math.round(w.volume)} kg`)
      .join(', ');

    const userPrompt = `The user has been flagged for a deload. Their profile:
- Goal: ${proProfile?.goal ?? 'unknown'}
- Experience: ${proProfile?.experienceLevel ?? 'unknown'}
- Triggered signals: ${signals}
- Weekly volumes (kg) last 5 weeks: ${weeklyVolumes}

Their recent exercises (last 14 days):
${exerciseList || '(no data)'}

Return JSON with this exact shape:
{
  "explanation": "2-3 sentences. Why deload is needed now. Specific numbers. No fluff.",
  "preset": {
    "name": "Deload Week",
    "exercises": [
      { "name": "...", "sets": 2, "targetReps": 10, "targetWeight": 60 }
    ]
  }
}

Rules for preset:
- Pick 4-6 exercises from their recent list (the most frequent ones)
- Sets: exactly 2 per exercise
- Weight: 60-70% of their recent working weight
- Cover the main movement patterns they've been training`;

    const rawResponse = await openaiChatCompletion({
      messages: [
        {
          role: 'system',
          content: 'You are a strength training coach. Be concise and direct. Return only valid JSON.',
        },
        { role: 'user', content: userPrompt },
      ],
      model: 'gpt-4o-mini',
      maxTokens: 600,
      responseFormatJsonObject: true,
    });

    let parsed: AiResponse;
    try {
      const json: unknown = JSON.parse(rawResponse);
      if (!isAiResponse(json)) throw new Error('Invalid shape');
      parsed = json;
    } catch {
      return NextResponse.json({ error: 'AI returned invalid response' }, { status: 500 });
    }

    // Update the recommendation row
    await db
      .update(deloadRecommendations)
      .set({
        aiExplanation: parsed.explanation,
        aiPresetData: parsed.preset,
      })
      .where(eq(deloadRecommendations.id, rec.id));

    return NextResponse.json({
      data: {
        explanation: parsed.explanation,
        preset: parsed.preset,
      },
    });
  } catch (err) {
    console.error('POST /api/deload/plan error:', err);
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('OPENAI_API_KEY')) {
      return NextResponse.json({ error: 'AI is not configured' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Failed to generate plan', message }, { status: 500 });
  }
}
