import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  workouts,
  workoutExercises,
  workoutSets,
  exercises,
} from '@/lib/db/schema';
import { eq, asc, sql } from 'drizzle-orm';
import { authenticateRequest } from '@/lib/auth/helpers';
import type {
  WorkoutDetail,
  WorkoutDetailExercise,
  WorkoutDetailSet,
} from '@/lib/api/types';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authenticateRequest(req);
  if (!auth) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 },
    );
  }

  const { id } = await params;

  try {
    const [workout] = await db
      .select()
      .from(workouts)
      .where(eq(workouts.id, id))
      .limit(1);

    if (!workout) {
      return NextResponse.json(
        { error: 'Workout not found' },
        { status: 404 },
      );
    }

    if (workout.userId !== auth.userId) {
      return NextResponse.json(
        { error: 'Workout not found' },
        { status: 404 },
      );
    }

    const weRows = await db
      .select({
        weId: workoutExercises.id,
        exerciseId: workoutExercises.exerciseId,
        order: workoutExercises.order,
        status: workoutExercises.status,
        exerciseName: exercises.name,
        category: exercises.category,
        imageUrl: exercises.imageUrl,
        measurementType: exercises.measurementType,
      })
      .from(workoutExercises)
      .innerJoin(exercises, eq(workoutExercises.exerciseId, exercises.id))
      .where(eq(workoutExercises.workoutId, id))
      .orderBy(asc(workoutExercises.order));

    const weIds = weRows.map((r) => r.weId);

    const setsMap = new Map<string, WorkoutDetailSet[]>();

    if (weIds.length > 0) {
      const allSets = await db
        .select()
        .from(workoutSets)
        .where(sql`${workoutSets.workoutExerciseId} = ANY(${weIds})`)
        .orderBy(asc(workoutSets.setIndex));

      for (const s of allSets) {
        const arr = setsMap.get(s.workoutExerciseId) ?? [];
        arr.push({
          id: s.id,
          setIndex: s.setIndex,
          weight: s.weight != null ? Number(s.weight) : null,
          reps: s.reps,
          seconds: s.seconds,
          completed: s.completed,
        });
        setsMap.set(s.workoutExerciseId, arr);
      }
    }

    const detailExercises: WorkoutDetailExercise[] = weRows.map((r) => ({
      id: r.weId,
      exerciseId: r.exerciseId,
      exerciseName: r.exerciseName,
      category: r.category,
      imageUrl: r.imageUrl,
      measurementType: r.measurementType,
      order: r.order,
      status: r.status,
      sets: setsMap.get(r.weId) ?? [],
    }));

    const detail: WorkoutDetail = {
      id: workout.id,
      userId: workout.userId,
      name: workout.name,
      startedAt: workout.startedAt?.toISOString() ?? null,
      endedAt: workout.endedAt?.toISOString() ?? null,
      durationSec: workout.durationSec,
      totalVolume: Number(workout.totalVolume ?? 0),
      totalSets: workout.totalSets ?? 0,
      notes: workout.notes,
      createdAt: workout.createdAt.toISOString(),
      exercises: detailExercises,
    };

    return NextResponse.json({ data: detail });
  } catch (err) {
    console.error('GET /api/workouts/[id] error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch workout', message: String(err) },
      { status: 500 },
    );
  }
}
