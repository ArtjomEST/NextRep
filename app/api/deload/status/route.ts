import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import {
  deloadRecommendations,
  userProfiles,
  workouts,
  workoutExercises,
  workoutSets,
} from '@/lib/db/schema';
import { eq, and, gt, gte, desc } from 'drizzle-orm';
import { authenticateRequest } from '@/lib/auth/helpers';
import { analyseDeloadNeed, buildWeeklyVolumes, getMondayOfWeek } from '@/lib/deload/analysis';

export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const db = getDb();
    const now = new Date();

    // Fetch user profile for deloadHidden flag
    const [profile] = await db
      .select({ deloadHidden: userProfiles.deloadHidden })
      .from(userProfiles)
      .where(eq(userProfiles.userId, auth.userId))
      .limit(1);

    const hidden = profile?.deloadHidden ?? false;

    // Check cache: non-expired row for this user
    const [cached] = await db
      .select()
      .from(deloadRecommendations)
      .where(
        and(
          eq(deloadRecommendations.userId, auth.userId),
          gt(deloadRecommendations.expiresAt, now),
        ),
      )
      .orderBy(desc(deloadRecommendations.createdAt))
      .limit(1);

    if (cached) {
      return NextResponse.json({
        data: {
          status: cached.status as 'good' | 'warning' | 'recommended',
          signals: cached.signals as string[],
          weeklyVolumes: cached.weeklyVolumes as { weekStart: string; volume: number }[],
          hidden,
        },
      });
    }

    // Build weekly volumes from the last 35 days of workout sets
    const since = new Date(now);
    since.setUTCDate(since.getUTCDate() - 35);

    // Query workouts + exercises + sets joined, sum weight*reps per workout
    const rows = await db
      .select({
        workoutCreatedAt: workouts.createdAt,
        weight: workoutSets.weight,
        reps: workoutSets.reps,
        completed: workoutSets.completed,
      })
      .from(workoutSets)
      .innerJoin(workoutExercises, eq(workoutSets.workoutExerciseId, workoutExercises.id))
      .innerJoin(workouts, eq(workoutExercises.workoutId, workouts.id))
      .where(
        and(
          eq(workouts.userId, auth.userId),
          gte(workouts.createdAt, since),
          eq(workoutSets.completed, true),
        ),
      );

    // Aggregate by ISO week (Monday)
    const weekMap = new Map<string, number>();
    for (const row of rows) {
      const weekStart = getMondayOfWeek(row.workoutCreatedAt);
      const vol = Number(row.weight ?? 0) * (row.reps ?? 0);
      weekMap.set(weekStart, (weekMap.get(weekStart) ?? 0) + vol);
    }

    const rawRows = Array.from(weekMap.entries()).map(([weekStart, volume]) => ({
      weekStart,
      volume,
    }));

    const weeklyVolumes = buildWeeklyVolumes(rawRows, 5);
    const analysis = analyseDeloadNeed(weeklyVolumes);

    // Insert cached result (expires in 24 hours)
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    await db
      .insert(deloadRecommendations)
      .values({
        userId: auth.userId,
        status: analysis.status,
        signals: analysis.signals,
        weeklyVolumes: analysis.weeklyVolumes,
        aiExplanation: null,
        aiPresetData: null,
        expiresAt,
      })
      .onConflictDoNothing();

    return NextResponse.json({
      data: {
        status: analysis.status,
        signals: analysis.signals,
        weeklyVolumes: analysis.weeklyVolumes,
        hidden,
      },
    });
  } catch (err) {
    console.error('GET /api/deload/status error:', err);
    return NextResponse.json(
      { error: 'Failed to compute deload status', message: String(err) },
      { status: 500 },
    );
  }
}
