import type { Database } from '@/lib/db';
import {
  workouts,
  workoutExercises,
  workoutSets,
  exercises,
} from '@/lib/db/schema';
import {
  eq,
  and,
  ne,
  inArray,
  asc,
  sql,
  isNotNull,
  or,
  gte,
} from 'drizzle-orm';
import type { WorkoutScoreInput } from './workoutScore';

export interface WorkoutExerciseSummary {
  name: string;
  sets: number;
  completedSets: number;
  volume: number;
}

export interface LoadedWorkoutScoreContext {
  input: WorkoutScoreInput;
  workoutName: string;
  durationMinutes: number;
  exercises: WorkoutExerciseSummary[];
  totalVolume: number;
  totalSetsPlanned: number;
  totalSetsCompleted: number;
}

function volumeFromSet(weight: number, reps: number | null): number {
  if (!reps || reps <= 0) return 0;
  return weight * reps;
}

export async function loadWorkoutScoreContext(
  db: Database,
  userId: string,
  workoutId: string,
): Promise<LoadedWorkoutScoreContext | null> {
  const [workout] = await db
    .select()
    .from(workouts)
    .where(eq(workouts.id, workoutId))
    .limit(1);

  if (!workout || workout.userId !== userId) return null;

  const weRows = await db
    .select({
      weId: workoutExercises.id,
      exerciseId: workoutExercises.exerciseId,
      order: workoutExercises.order,
      exerciseName: exercises.name,
    })
    .from(workoutExercises)
    .innerJoin(exercises, eq(workoutExercises.exerciseId, exercises.id))
    .where(eq(workoutExercises.workoutId, workoutId))
    .orderBy(asc(workoutExercises.order));

  const weIds = weRows.map((r) => r.weId);
  const allSets =
    weIds.length === 0
      ? []
      : await db
          .select()
          .from(workoutSets)
          .where(inArray(workoutSets.workoutExerciseId, weIds))
          .orderBy(asc(workoutSets.setIndex));

  const setsByWe = new Map<string, typeof allSets>();
  for (const s of allSets) {
    const arr = setsByWe.get(s.workoutExerciseId) ?? [];
    arr.push(s);
    setsByWe.set(s.workoutExerciseId, arr);
  }

  let plannedSets = 0;
  let completedSets = 0;
  let sumWeightForAvg = 0;
  let countWeightForAvg = 0;
  let computedVolume = 0;
  const exerciseSummaries: WorkoutExerciseSummary[] = [];
  const currentMaxWeightByExercise = new Map<string, number>();

  for (const we of weRows) {
    const sets = setsByWe.get(we.weId) ?? [];
    let exVol = 0;
    let exCompleted = 0;
    let exMaxW = 0;
    for (const s of sets) {
      plannedSets += 1;
      const w = s.weight != null ? Number(s.weight) : 0;
      const r = s.reps;
      if (s.completed) {
        completedSets += 1;
        exCompleted += 1;
        exVol += volumeFromSet(w, r);
        if (w > 0) {
          sumWeightForAvg += w;
          countWeightForAvg += 1;
          if (w > exMaxW) exMaxW = w;
        }
      }
    }
    computedVolume += exVol;
    exerciseSummaries.push({
      name: we.exerciseName,
      sets: sets.length,
      completedSets: exCompleted,
      volume: Math.round(exVol * 10) / 10,
    });
    if (exMaxW > 0) {
      const prev = currentMaxWeightByExercise.get(we.exerciseId) ?? 0;
      if (exMaxW > prev) currentMaxWeightByExercise.set(we.exerciseId, exMaxW);
    }
  }

  const storedVol = Number(workout.totalVolume ?? 0);
  const currentWorkoutVolume =
    storedVol > 0 ? storedVol : Math.round(computedVolume * 10) / 10;

  const durationMinutes =
    workout.durationSec != null && workout.durationSec > 0
      ? Math.round(workout.durationSec / 60)
      : workout.startedAt && workout.endedAt
        ? Math.round(
            (new Date(workout.endedAt).getTime() -
              new Date(workout.startedAt).getTime()) /
              60000,
          )
        : 0;

  const currentAvgWeightPerSet =
    countWeightForAvg > 0 ? sumWeightForAvg / countWeightForAvg : 0;

  const fourWeeksAgo = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000);

  const recentOthers = await db
    .select({
      id: workouts.id,
      totalVolume: workouts.totalVolume,
    })
    .from(workouts)
    .where(
      and(
        eq(workouts.userId, userId),
        ne(workouts.id, workoutId),
        or(isNotNull(workouts.endedAt), isNotNull(workouts.startedAt)),
        gte(
          sql`coalesce(${workouts.startedAt}, ${workouts.createdAt})`,
          fourWeeksAgo,
        ),
      ),
    );

  const avgWorkoutVolumeLast4Weeks =
    recentOthers.length > 0
      ? recentOthers.reduce(
          (s, w) => s + Number(w.totalVolume ?? 0),
          0,
        ) / recentOthers.length
      : 0;

  const avgByWorkout = await db
    .select({
      workoutId: workouts.id,
      avgW: sql<string>`avg(${workoutSets.weight}::numeric)`,
    })
    .from(workouts)
    .innerJoin(
      workoutExercises,
      eq(workoutExercises.workoutId, workouts.id),
    )
    .innerJoin(
      workoutSets,
      eq(workoutSets.workoutExerciseId, workoutExercises.id),
    )
    .where(
      and(
        eq(workouts.userId, userId),
        ne(workouts.id, workoutId),
        eq(workoutSets.completed, true),
        sql`${workoutSets.weight} is not null`,
        sql`${workoutSets.weight}::numeric > 0`,
      ),
    )
    .groupBy(workouts.id);

  const avgs = avgByWorkout
    .map((r) => Number(r.avgW))
    .filter((n) => !Number.isNaN(n) && n > 0);
  const bestEverAvgWeightPerSet =
    avgs.length > 0 ? Math.max(...avgs) : 0;

  const exerciseIds = [...new Set(weRows.map((r) => r.exerciseId))];
  let hasPersonalRecord = false;

  if (exerciseIds.length > 0 && currentMaxWeightByExercise.size > 0) {
    const hist = await db
      .select({
        exerciseId: workoutExercises.exerciseId,
        maxW: sql<string>`max(${workoutSets.weight}::numeric)`,
      })
      .from(workoutSets)
      .innerJoin(
        workoutExercises,
        eq(workoutSets.workoutExerciseId, workoutExercises.id),
      )
      .innerJoin(workouts, eq(workoutExercises.workoutId, workouts.id))
      .where(
        and(
          eq(workouts.userId, userId),
          ne(workouts.id, workoutId),
          eq(workoutSets.completed, true),
          inArray(workoutExercises.exerciseId, exerciseIds),
          sql`${workoutSets.weight} is not null`,
        ),
      )
      .groupBy(workoutExercises.exerciseId);

    const histMax = new Map<string, number>();
    for (const row of hist) {
      histMax.set(row.exerciseId, Number(row.maxW));
    }

    for (const [exId, curMax] of currentMaxWeightByExercise) {
      const prev = histMax.get(exId);
      if (prev === undefined || curMax > prev) {
        hasPersonalRecord = true;
        break;
      }
    }
  }

  const input: WorkoutScoreInput = {
    currentWorkoutVolume,
    avgWorkoutVolumeLast4Weeks,
    currentAvgWeightPerSet,
    bestEverAvgWeightPerSet,
    completedSets,
    plannedSets,
    durationMinutes,
    hasPersonalRecord,
  };

  return {
    input,
    workoutName: workout.name,
    durationMinutes,
    exercises: exerciseSummaries,
    totalVolume: currentWorkoutVolume,
    totalSetsPlanned: plannedSets,
    totalSetsCompleted: completedSets,
  };
}
