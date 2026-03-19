import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { workouts, workoutLikes, users } from '@/lib/db/schema';
import { eq, and, count as drizzleCount } from 'drizzle-orm';
import { authenticateRequest } from '@/lib/auth/helpers';
import { notifyTelegramUser } from '@/lib/telegram/notify';
import { displayUserName } from '@/lib/users/display';

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

    const [w] = await db
      .select({
        id: workouts.id,
        userId: workouts.userId,
        isPublic: workouts.isPublic,
        endedAt: workouts.endedAt,
      })
      .from(workouts)
      .where(eq(workouts.id, workoutId))
      .limit(1);

    if (!w || !w.isPublic || !w.endedAt) {
      return NextResponse.json(
        { error: 'Workout not found' },
        { status: 404 },
      );
    }

    const [existing] = await db
      .select({ id: workoutLikes.id })
      .from(workoutLikes)
      .where(
        and(
          eq(workoutLikes.userId, auth.userId),
          eq(workoutLikes.workoutId, workoutId),
        ),
      )
      .limit(1);

    if (existing) {
      await db
        .delete(workoutLikes)
        .where(
          and(
            eq(workoutLikes.userId, auth.userId),
            eq(workoutLikes.workoutId, workoutId),
          ),
        );
    } else {
      await db.insert(workoutLikes).values({
        userId: auth.userId,
        workoutId,
      });

      if (w.userId !== auth.userId) {
        const [owner, liker] = await Promise.all([
          db
            .select({ telegramUserId: users.telegramUserId })
            .from(users)
            .where(eq(users.id, w.userId))
            .limit(1)
            .then((r) => r[0]),
          db
            .select({
              firstName: users.firstName,
              lastName: users.lastName,
              username: users.username,
            })
            .from(users)
            .where(eq(users.id, auth.userId))
            .limit(1)
            .then((r) => r[0]),
        ]);
        if (owner && liker) {
          notifyTelegramUser(
            owner.telegramUserId,
            `💪 ${displayUserName(liker)} liked your workout`,
          );
        }
      }
    }

    const [cnt] = await db
      .select({ c: drizzleCount() })
      .from(workoutLikes)
      .where(eq(workoutLikes.workoutId, workoutId));

    return NextResponse.json({
      liked: !existing,
      likeCount: Number(cnt?.c ?? 0),
    });
  } catch (err) {
    console.error('POST /api/workouts/[id]/like:', err);
    return NextResponse.json(
      { error: 'Failed to toggle like', message: String(err) },
      { status: 500 },
    );
  }
}
