import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { workouts, workoutExercises, workoutSets } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { authenticateRequest } from '@/lib/auth/helpers';
import { randomUUID } from 'crypto';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** POST /api/workouts/[id]/exercises — add an exercise to an in-progress workout */
export async function POST(
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

    const { id: workoutId } = await params;

    const [workout] = await db
      .select({ id: workouts.id, userId: workouts.userId, endedAt: workouts.endedAt })
      .from(workouts)
      .where(eq(workouts.id, workoutId))
      .limit(1);

    if (!workout || workout.userId !== auth.userId) {
      return NextResponse.json(
        { error: 'Workout not found' },
        { status: 404 },
      );
    }

    if (workout.endedAt != null) {
      return NextResponse.json(
        { error: 'Cannot add exercise to a finished workout' },
        { status: 400 },
      );
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 },
      );
    }

    const b = body as Record<string, unknown>;
    const exerciseId = typeof b.exerciseId === 'string' ? b.exerciseId : '';
    if (!UUID_RE.test(exerciseId)) {
      return NextResponse.json(
        { error: 'exerciseId must be a valid UUID' },
        { status: 400 },
      );
    }

    const [maxOrderRow] = await db
      .select({ order: workoutExercises.order })
      .from(workoutExercises)
      .where(eq(workoutExercises.workoutId, workoutId))
      .orderBy(desc(workoutExercises.order))
      .limit(1);

    const nextOrder = (maxOrderRow?.order ?? -1) + 1;
    const weId = randomUUID();

    await db.insert(workoutExercises).values({
      id: weId,
      workoutId,
      exerciseId,
      order: nextOrder,
      status: 'pending',
    });

    await db.insert(workoutSets).values({
      id: randomUUID(),
      workoutExerciseId: weId,
      setIndex: 1,
      weight: null,
      reps: null,
      seconds: null,
      completed: false,
    });

    return NextResponse.json(
      { data: { workoutExerciseId: weId, order: nextOrder } },
      { status: 201 },
    );
  } catch (err) {
    console.error('POST /api/workouts/[id]/exercises error:', err);
    return NextResponse.json(
      { error: 'Failed to add exercise', message: String(err) },
      { status: 500 },
    );
  }
}
