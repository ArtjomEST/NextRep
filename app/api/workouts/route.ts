import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { workouts, workoutExercises, workoutSets } from '@/lib/db/schema';
import { eq, desc, sql, count as drizzleCount } from 'drizzle-orm';
import { validateSaveWorkout } from '@/lib/api/validate';
import { authenticateRequest } from '@/lib/auth/helpers';
import type { SaveWorkoutResponse, WorkoutListItem } from '@/lib/api/types';
import { randomUUID } from 'crypto';

// ─── GET /api/workouts ───────────────────────────────────────

export async function GET(req: NextRequest) {
  const db = getDb();
  const auth = await authenticateRequest(req);
  if (!auth) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 },
    );
  }

  const { searchParams } = req.nextUrl;
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 100);
  const offset = Math.max(parseInt(searchParams.get('offset') ?? '0'), 0);
  const userId = auth.userId;

  try {
    const rows = await db
      .select({
        id: workouts.id,
        name: workouts.name,
        createdAt: workouts.createdAt,
        startedAt: workouts.startedAt,
        endedAt: workouts.endedAt,
        totalVolume: workouts.totalVolume,
        totalSets: workouts.totalSets,
        durationSec: workouts.durationSec,
      })
      .from(workouts)
      .where(eq(workouts.userId, userId))
      .orderBy(desc(workouts.createdAt))
      .limit(limit)
      .offset(offset);

    const [totalResult] = await db
      .select({ value: drizzleCount() })
      .from(workouts)
      .where(eq(workouts.userId, userId));

    const exerciseCountMap = new Map<string, number>();
    if (rows.length > 0) {
      const workoutIds = rows.map((r) => r.id);
      const counts = await db
        .select({
          workoutId: workoutExercises.workoutId,
          count: drizzleCount(),
        })
        .from(workoutExercises)
        .where(sql`${workoutExercises.workoutId} = ANY(${workoutIds})`)
        .groupBy(workoutExercises.workoutId);

      for (const c of counts) {
        exerciseCountMap.set(c.workoutId, Number(c.count));
      }
    }

    const data: WorkoutListItem[] = rows.map((r) => ({
      id: r.id,
      name: r.name,
      createdAt: r.createdAt.toISOString(),
      startedAt: r.startedAt?.toISOString() ?? null,
      endedAt: r.endedAt?.toISOString() ?? null,
      totalVolume: Number(r.totalVolume ?? 0),
      totalSets: r.totalSets ?? 0,
      durationSec: r.durationSec,
      exerciseCount: exerciseCountMap.get(r.id) ?? 0,
    }));

    if (process.env.NODE_ENV !== 'production') {
      console.log(
        `[GET /api/workouts] auth=${auth.mode} userId=${userId} returned=${data.length} total=${Number(totalResult?.value ?? 0)}`,
      );
    }

    return NextResponse.json({
      data,
      total: Number(totalResult?.value ?? 0),
      limit,
      offset,
    });
  } catch (err) {
    console.error('GET /api/workouts error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch workouts', message: String(err) },
      { status: 500 },
    );
  }
}

// ─── POST /api/workouts ─────────────────────────────────────

export async function POST(req: NextRequest) {
  const db = getDb();
  const auth = await authenticateRequest(req);
  if (!auth) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 },
    );
  }

  try {
    const body = await req.json();
    const result = validateSaveWorkout(body);

    if (!result.data) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const data = result.data;
    const userId = auth.userId;

    let totalVolume = 0;
    let totalSets = 0;

    for (const ex of data.exercises) {
      for (const s of ex.sets) {
        totalSets++;
        if (s.weight != null && s.reps != null) {
          totalVolume += s.weight * s.reps;
        }
      }
    }

    let durationSec = data.durationSec ?? null;
    if (durationSec == null && data.startedAt && data.endedAt) {
      const diff =
        new Date(data.endedAt).getTime() - new Date(data.startedAt).getTime();
      if (diff > 0) durationSec = Math.round(diff / 1000);
    }

    const workoutId = randomUUID();
    const workoutExerciseRows: {
      id: string;
      workoutId: string;
      exerciseId: string;
      order: number;
      status: 'pending' | 'completed';
    }[] = [];
    const workoutSetRows: {
      id: string;
      workoutExerciseId: string;
      setIndex: number;
      weight: string | null;
      reps: number | null;
      seconds: number | null;
      completed: boolean;
    }[] = [];

    for (const ex of data.exercises) {
      const weId = randomUUID();
      workoutExerciseRows.push({
        id: weId,
        workoutId,
        exerciseId: ex.exerciseId,
        order: ex.order,
        status: ex.status ?? 'pending',
      });
      for (const s of ex.sets) {
        workoutSetRows.push({
          id: randomUUID(),
          workoutExerciseId: weId,
          setIndex: s.setIndex,
          weight: s.weight != null ? String(s.weight) : null,
          reps: s.reps,
          seconds: s.seconds ?? null,
          completed: s.completed ?? false,
        });
      }
    }

    await db.transaction(async (tx) => {
      await tx.insert(workouts).values({
        id: workoutId,
        userId,
        name: data.name.trim(),
        startedAt: data.startedAt ? new Date(data.startedAt) : null,
        endedAt: data.endedAt ? new Date(data.endedAt) : null,
        durationSec,
        totalVolume: String(totalVolume),
        totalSets,
        notes: data.notes ?? null,
      });

      if (workoutExerciseRows.length > 0) {
        await tx.insert(workoutExercises).values(workoutExerciseRows);
      }

      if (workoutSetRows.length > 0) {
        await tx.insert(workoutSets).values(workoutSetRows);
      }
    });

    const response: SaveWorkoutResponse = {
      workoutId,
      createdAt: new Date().toISOString(),
      totalVolume,
      totalSets,
      durationSec,
    };

    if (process.env.NODE_ENV !== 'production') {
      console.log(
        `[POST /api/workouts] auth=${auth.mode} userId=${userId} workoutId=${workoutId} exercises=${workoutExerciseRows.length} sets=${workoutSetRows.length}`,
      );
    }

    return NextResponse.json({ data: response }, { status: 201 });
  } catch (err) {
    console.error('POST /api/workouts error:', err);
    return NextResponse.json(
      { error: 'Failed to create workout', message: String(err) },
      { status: 500 },
    );
  }
}
