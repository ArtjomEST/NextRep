import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { workouts, workoutExercises, workoutSets } from '@/lib/db/schema';
import { eq, inArray, isNotNull, and, desc, asc } from 'drizzle-orm';
import { authenticateRequest } from '@/lib/auth/helpers';

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const auth = await authenticateRequest(req);
    if (!auth) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(req.url);
    const exerciseIdsParam = searchParams.get('exerciseIds');
    if (!exerciseIdsParam) {
      return NextResponse.json({ data: {} });
    }

    const exerciseIds = exerciseIdsParam
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);

    if (exerciseIds.length === 0) {
      return NextResponse.json({ data: {} });
    }

    // Find the most recent completed workout exercise for each exerciseId
    const recentWEs = await db
      .select({
        weId: workoutExercises.id,
        exerciseId: workoutExercises.exerciseId,
        endedAt: workouts.endedAt,
      })
      .from(workoutExercises)
      .innerJoin(workouts, eq(workoutExercises.workoutId, workouts.id))
      .where(
        and(
          inArray(workoutExercises.exerciseId, exerciseIds),
          eq(workouts.userId, auth.userId),
          isNotNull(workouts.endedAt),
        ),
      )
      .orderBy(desc(workouts.endedAt));

    // For each exerciseId, keep only the most recent workoutExercise
    const latestWeByExercise = new Map<string, string>(); // exerciseId -> weId
    for (const row of recentWEs) {
      if (!latestWeByExercise.has(row.exerciseId)) {
        latestWeByExercise.set(row.exerciseId, row.weId);
      }
    }

    const weIds = [...latestWeByExercise.values()];
    const allSets =
      weIds.length > 0
        ? await db
            .select({
              workoutExerciseId: workoutSets.workoutExerciseId,
              setIndex: workoutSets.setIndex,
              weight: workoutSets.weight,
              reps: workoutSets.reps,
            })
            .from(workoutSets)
            .where(inArray(workoutSets.workoutExerciseId, weIds))
            .orderBy(asc(workoutSets.setIndex))
        : [];

    const result: Record<string, Array<{ weight: number | null; reps: number | null }>> = {};

    for (const [exerciseId, weId] of latestWeByExercise) {
      result[exerciseId] = allSets
        .filter((s) => s.workoutExerciseId === weId)
        .map((s) => ({
          weight: s.weight != null ? Number(s.weight) : null,
          reps: s.reps,
        }));
    }

    return NextResponse.json({ data: result });
  } catch (err) {
    console.error('GET /api/workouts/last-sets error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch last sets', message: String(err) },
      { status: 500 },
    );
  }
}
