import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import {
  workouts,
  workoutExercises,
  workoutSets,
  exercises,
} from '@/lib/db/schema';
import { eq, asc, inArray, and, isNotNull, ne, desc } from 'drizzle-orm';
import { authenticateRequest } from '@/lib/auth/helpers';
import type {
  WorkoutDetail,
  WorkoutDetailExercise,
  WorkoutDetailSet,
} from '@/lib/api/types';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const db = getDb();
    const auth = await authenticateRequest(req);
    if (!auth) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 },
      );
    }

    const { id } = await params;

    const [workout] = await db
      .select({ id: workouts.id, userId: workouts.userId })
      .from(workouts)
      .where(eq(workouts.id, id))
      .limit(1);

    if (!workout || workout.userId !== auth.userId) {
      return NextResponse.json(
        { error: 'Workout not found' },
        { status: 404 },
      );
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const o =
      body && typeof body === 'object'
        ? (body as Record<string, unknown>)
        : {};

    const patch: { isPublic?: boolean; photoUrl?: string | null } = {};

    if ('isPublic' in o) {
      if (typeof o.isPublic !== 'boolean') {
        return NextResponse.json(
          { error: 'Invalid isPublic' },
          { status: 400 },
        );
      }
      patch.isPublic = o.isPublic;
    }

    if ('photoUrl' in o) {
      if (o.photoUrl === null) {
        patch.photoUrl = null;
      } else if (typeof o.photoUrl === 'string') {
        const u = o.photoUrl.trim();
        patch.photoUrl = u.length > 0 ? u : null;
      } else {
        return NextResponse.json(
          { error: 'Invalid photoUrl' },
          { status: 400 },
        );
      }
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update (use isPublic and/or photoUrl)' },
        { status: 400 },
      );
    }

    await db
      .update(workouts)
      .set(patch)
      .where(and(eq(workouts.id, id), eq(workouts.userId, auth.userId)));

    const [row] = await db
      .select({ photoUrl: workouts.photoUrl, isPublic: workouts.isPublic })
      .from(workouts)
      .where(eq(workouts.id, id))
      .limit(1);

    return NextResponse.json({
      data: {
        photoUrl: row?.photoUrl ?? null,
        isPublic: row?.isPublic ?? true,
      },
    });
  } catch (err) {
    console.error('PATCH /api/workouts/[id] error:', err);
    return NextResponse.json(
      { error: 'Failed to update workout', message: String(err) },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const db = getDb();
    const auth = await authenticateRequest(req);
    if (!auth) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 },
      );
    }

    const { id } = await params;

    const [workout] = await db
      .select({ id: workouts.id, userId: workouts.userId })
      .from(workouts)
      .where(eq(workouts.id, id))
      .limit(1);

    if (!workout || workout.userId !== auth.userId) {
      return NextResponse.json(
        { error: 'Workout not found' },
        { status: 404 },
      );
    }

    const weRows = await db
      .select({ id: workoutExercises.id })
      .from(workoutExercises)
      .where(eq(workoutExercises.workoutId, id));
    const weIds = weRows.map((r) => r.id);

    if (weIds.length > 0) {
      await db
        .delete(workoutSets)
        .where(inArray(workoutSets.workoutExerciseId, weIds));
    }
    await db
      .delete(workoutExercises)
      .where(eq(workoutExercises.workoutId, id));
    await db.delete(workouts).where(eq(workouts.id, id));

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error('DELETE /api/workouts/[id] error:', err);
    return NextResponse.json(
      { error: 'Failed to delete workout', message: String(err) },
      { status: 500 },
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const db = getDb();
    const auth = await authenticateRequest(req);
    if (!auth) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 },
      );
    }

    const { id } = await params;

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
        .where(inArray(workoutSets.workoutExerciseId, weIds))
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

    // Fetch last sets from the most recent prior completed workout for each exercise
    const exerciseIds = weRows.map((r) => r.exerciseId);
    const lastSetsMap = new Map<string, Array<{ weight: number | null; reps: number | null }>>();

    if (exerciseIds.length > 0) {
      const recentWEs = await db
        .select({
          weId: workoutExercises.id,
          exerciseId: workoutExercises.exerciseId,
        })
        .from(workoutExercises)
        .innerJoin(workouts, eq(workoutExercises.workoutId, workouts.id))
        .where(
          and(
            inArray(workoutExercises.exerciseId, exerciseIds),
            eq(workouts.userId, auth.userId),
            isNotNull(workouts.endedAt),
            ne(workouts.id, id),
          ),
        )
        .orderBy(desc(workouts.endedAt));

      const latestWeByExercise = new Map<string, string>();
      for (const row of recentWEs) {
        if (!latestWeByExercise.has(row.exerciseId)) {
          latestWeByExercise.set(row.exerciseId, row.weId);
        }
      }

      const prevWeIds = [...latestWeByExercise.values()];
      const prevSets =
        prevWeIds.length > 0
          ? await db
              .select({
                workoutExerciseId: workoutSets.workoutExerciseId,
                weight: workoutSets.weight,
                reps: workoutSets.reps,
              })
              .from(workoutSets)
              .where(inArray(workoutSets.workoutExerciseId, prevWeIds))
              .orderBy(asc(workoutSets.setIndex))
          : [];

      for (const [exerciseId, weId] of latestWeByExercise) {
        lastSetsMap.set(
          exerciseId,
          prevSets
            .filter((s) => s.workoutExerciseId === weId)
            .map((s) => ({
              weight: s.weight != null ? Number(s.weight) : null,
              reps: s.reps,
            })),
        );
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
      lastSets: lastSetsMap.get(r.exerciseId) ?? [],
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
