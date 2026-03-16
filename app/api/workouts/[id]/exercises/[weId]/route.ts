import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { workouts, workoutExercises, workoutSets } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { authenticateRequest } from '@/lib/auth/helpers';

/** DELETE /api/workouts/[id]/exercises/[weId] — remove an exercise (and its sets) from a workout */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; weId: string }> },
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

    const { id: workoutId, weId } = await params;

    const [workout] = await db
      .select({ id: workouts.id, userId: workouts.userId })
      .from(workouts)
      .where(eq(workouts.id, workoutId))
      .limit(1);

    if (!workout || workout.userId !== auth.userId) {
      return NextResponse.json(
        { error: 'Workout not found' },
        { status: 404 },
      );
    }

    const [weRow] = await db
      .select({ id: workoutExercises.id })
      .from(workoutExercises)
      .where(
        and(
          eq(workoutExercises.workoutId, workoutId),
          eq(workoutExercises.id, weId),
        ),
      )
      .limit(1);

    if (!weRow) {
      return NextResponse.json(
        { error: 'Exercise not found in this workout' },
        { status: 404 },
      );
    }

    await db
      .delete(workoutSets)
      .where(eq(workoutSets.workoutExerciseId, weId));
    await db
      .delete(workoutExercises)
      .where(eq(workoutExercises.id, weId));

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error('DELETE /api/workouts/[id]/exercises/[weId] error:', err);
    return NextResponse.json(
      { error: 'Failed to remove exercise', message: String(err) },
      { status: 500 },
    );
  }
}
