import { and, eq, isNotNull, lt, ne } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import type { Database } from '@/lib/db';
import {
  workouts,
  workoutExercises,
  workoutSets,
  exercises,
} from '@/lib/db/schema';

/**
 * True if any weight_reps exercise in this workout has a completed set whose weight
 * exceeds the user's best completed weight for that exercise in prior ended workouts.
 */
export async function workoutHasPersonalRecord(
  db: Database,
  workoutId: string,
): Promise<boolean> {
  const [w] = await db
    .select({
      userId: workouts.userId,
      endedAt: workouts.endedAt,
    })
    .from(workouts)
    .where(eq(workouts.id, workoutId))
    .limit(1);

  if (!w?.endedAt) return false;

  const setRows = await db
    .select({
      exerciseId: workoutExercises.exerciseId,
      weight: workoutSets.weight,
      measurementType: exercises.measurementType,
    })
    .from(workoutSets)
    .innerJoin(
      workoutExercises,
      eq(workoutSets.workoutExerciseId, workoutExercises.id),
    )
    .innerJoin(exercises, eq(workoutExercises.exerciseId, exercises.id))
    .where(
      and(
        eq(workoutExercises.workoutId, workoutId),
        eq(workoutSets.completed, true),
        isNotNull(workoutSets.weight),
        eq(exercises.measurementType, 'weight_reps'),
      ),
    );

  const currentMaxByExercise = new Map<string, number>();
  for (const r of setRows) {
    const wt = Number(r.weight);
    if (!Number.isFinite(wt) || wt <= 0) continue;
    const prev = currentMaxByExercise.get(r.exerciseId) ?? 0;
    if (wt > prev) currentMaxByExercise.set(r.exerciseId, wt);
  }

  for (const [exerciseId, currentMax] of currentMaxByExercise) {
    const [hist] = await db
      .select({
        mx: sql<string>`max((${workoutSets.weight})::numeric)`,
      })
      .from(workoutSets)
      .innerJoin(
        workoutExercises,
        eq(workoutSets.workoutExerciseId, workoutExercises.id),
      )
      .innerJoin(workouts, eq(workoutExercises.workoutId, workouts.id))
      .innerJoin(exercises, eq(workoutExercises.exerciseId, exercises.id))
      .where(
        and(
          eq(workouts.userId, w.userId),
          eq(workoutExercises.exerciseId, exerciseId),
          eq(exercises.measurementType, 'weight_reps'),
          eq(workoutSets.completed, true),
          isNotNull(workoutSets.weight),
          isNotNull(workouts.endedAt),
          lt(workouts.endedAt, w.endedAt),
          ne(workouts.id, workoutId),
        ),
      );

    const priorMax = hist?.mx != null ? Number(hist.mx) : 0;
    if (currentMax > priorMax) return true;
  }

  return false;
}
