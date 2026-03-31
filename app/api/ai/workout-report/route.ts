import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import {
  workouts,
  workoutExercises,
  exercises,
  aiWorkoutReports,
} from '@/lib/db/schema';
import { eq, and, desc, inArray, asc } from 'drizzle-orm';
import { authenticateRequest } from '@/lib/auth/helpers';
import { loadWorkoutScoreContext } from '@/lib/ai/workoutScoreContext';
import { computeWorkoutScore } from '@/lib/ai/workoutScore';
import { openaiChatCompletion } from '@/lib/ai/openai';
import { formatCardioParams } from '@/lib/cardio-params';

function scoresPayload(scores: ReturnType<typeof computeWorkoutScore>) {
  return {
    total: scores.total,
    volume: scores.volume,
    intensity: scores.intensity,
    consistency: scores.consistency,
    duration: scores.duration,
    prBonus: scores.prBonus,
  };
}

export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 },
      );
    }

    const workoutId = req.nextUrl.searchParams.get('workoutId')?.trim();
    if (!workoutId) {
      return NextResponse.json(
        { error: 'workoutId query parameter is required' },
        { status: 400 },
      );
    }

    const db = getDb();
    const [row] = await db
      .select()
      .from(aiWorkoutReports)
      .where(
        and(
          eq(aiWorkoutReports.userId, auth.userId),
          eq(aiWorkoutReports.workoutId, workoutId),
        ),
      )
      .limit(1);

    if (!row) {
      return NextResponse.json({ data: null });
    }

    return NextResponse.json({
      data: {
        report: row.report,
        scores: {
          total: row.score,
          volume: row.volumeScore,
          intensity: row.intensityScore,
          consistency: row.consistencyScore,
          duration: row.durationScore,
          prBonus: row.prBonus,
        },
      },
    });
  } catch (err) {
    console.error('GET /api/ai/workout-report error:', err);
    return NextResponse.json(
      { error: 'Failed to load report', message: String(err) },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 },
      );
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const workoutId =
      body &&
      typeof body === 'object' &&
      typeof (body as { workoutId?: unknown }).workoutId === 'string'
        ? (body as { workoutId: string }).workoutId.trim()
        : '';

    if (!workoutId) {
      return NextResponse.json({ error: 'workoutId is required' }, { status: 400 });
    }

    const db = getDb();

    const [existing] = await db
      .select()
      .from(aiWorkoutReports)
      .where(
        and(
          eq(aiWorkoutReports.userId, auth.userId),
          eq(aiWorkoutReports.workoutId, workoutId),
        ),
      )
      .limit(1);

    if (existing) {
      return NextResponse.json({
        report: existing.report,
        scores: scoresPayload({
          total: existing.score,
          volume: existing.volumeScore,
          intensity: existing.intensityScore,
          consistency: existing.consistencyScore,
          duration: existing.durationScore,
          prBonus: existing.prBonus,
        }),
      });
    }

    const loaded = await loadWorkoutScoreContext(db, auth.userId, workoutId);
    if (!loaded) {
      return NextResponse.json({ error: 'Workout not found' }, { status: 404 });
    }

    const scores = computeWorkoutScore(loaded.input);

    const last5 = await db
      .select({
        name: workouts.name,
        createdAt: workouts.createdAt,
        endedAt: workouts.endedAt,
        startedAt: workouts.startedAt,
        totalVolume: workouts.totalVolume,
        id: workouts.id,
      })
      .from(workouts)
      .where(eq(workouts.userId, auth.userId))
      .orderBy(desc(workouts.createdAt))
      .limit(5);

    const ids = last5.map((w) => w.id);
    const namesByWorkout = new Map<string, string[]>();
    if (ids.length > 0) {
      const we = await db
        .select({
          workoutId: workoutExercises.workoutId,
          exerciseName: exercises.name,
          order: workoutExercises.order,
        })
        .from(workoutExercises)
        .innerJoin(exercises, eq(workoutExercises.exerciseId, exercises.id))
        .where(inArray(workoutExercises.workoutId, ids))
        .orderBy(asc(workoutExercises.workoutId), asc(workoutExercises.order));
      for (const row of we) {
        const arr = namesByWorkout.get(row.workoutId) ?? [];
        arr.push(row.exerciseName);
        namesByWorkout.set(row.workoutId, arr);
      }
    }

    const historySummary = last5
      .map((w) => {
        const d = (w.endedAt ?? w.startedAt ?? w.createdAt)
          .toISOString()
          .slice(0, 10);
        const names = namesByWorkout.get(w.id) ?? [];
        return `- ${w.name} (${d}), ${Number(w.totalVolume ?? 0)} kg, ${names.slice(0, 4).join(', ')}${names.length > 4 ? '…' : ''}`;
      })
      .join('\n');

    const exerciseLines = loaded.exercises.map((ex) => {
      if (ex.measurementType === 'cardio') {
        const sec = ex.cardioSeconds ?? 0;
        const mins = Math.floor(sec / 60);
        const secs = sec % 60;
        const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')} мин`;
        const paramsStr = ex.cardioParams
          ? formatCardioParams(ex.cardioParams, ex.name)
          : '';
        return `- ${ex.name}: ${timeStr}${paramsStr ? ' · ' + paramsStr : ''}`;
      }
      return `- ${ex.name}: ${ex.completedSets}/${ex.sets} sets, ${ex.volume} kg volume`;
    });

    const workoutContext = JSON.stringify({
      name: loaded.workoutName,
      durationMinutes: loaded.durationMinutes,
      totalVolume: loaded.totalVolume,
      totalSets: loaded.totalSetsPlanned,
      completedSets: loaded.totalSetsCompleted,
    });

    const userPrompt = `Analyze this workout and give a 3-4 sentence English coaching report.
Be specific using the actual numbers. Mention what went well, what to improve,
and one concrete recommendation for next session.

Workout: ${workoutContext}
Exercises:
${exerciseLines.join('\n')}

Score breakdown: volume: ${scores.volume}, intensity: ${scores.intensity}, consistency: ${scores.consistency}, duration: ${scores.duration}, prBonus: ${scores.prBonus}

User's history (last 5 workouts summary):
${historySummary || '(none)'}`;

    const report = await openaiChatCompletion({
      messages: [
        {
          role: 'system',
          content:
            'You are Alex, a concise strength-training coach. Output only the coaching report, no title or bullet list unless essential.',
        },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.55,
    });

    try {
      await db.insert(aiWorkoutReports).values({
        userId: auth.userId,
        workoutId,
        report,
        score: scores.total,
        volumeScore: scores.volume,
        intensityScore: scores.intensity,
        consistencyScore: scores.consistency,
        durationScore: scores.duration,
        prBonus: scores.prBonus,
      });
    } catch (insertErr) {
      const [raceRow] = await db
        .select()
        .from(aiWorkoutReports)
        .where(
          and(
            eq(aiWorkoutReports.userId, auth.userId),
            eq(aiWorkoutReports.workoutId, workoutId),
          ),
        )
        .limit(1);
      if (raceRow) {
        return NextResponse.json({
          report: raceRow.report,
          scores: scoresPayload({
            total: raceRow.score,
            volume: raceRow.volumeScore,
            intensity: raceRow.intensityScore,
            consistency: raceRow.consistencyScore,
            duration: raceRow.durationScore,
            prBonus: raceRow.prBonus,
          }),
        });
      }
      throw insertErr;
    }

    return NextResponse.json({
      report,
      scores: scoresPayload(scores),
    });
  } catch (err) {
    console.error('POST /api/ai/workout-report error:', err);
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('OPENAI_API_KEY')) {
      return NextResponse.json(
        { error: 'AI is not configured' },
        { status: 503 },
      );
    }
    return NextResponse.json(
      { error: 'Failed to generate report', message },
      { status: 500 },
    );
  }
}
