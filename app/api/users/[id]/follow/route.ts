import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { users, follows } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { authenticateRequest } from '@/lib/auth/helpers';
import { notifyNewFollower } from '@/lib/telegram/notify';

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

    const { id: followingId } = await params;
    if (followingId === auth.userId) {
      return NextResponse.json(
        { error: 'Cannot follow yourself' },
        { status: 400 },
      );
    }

    const [target] = await db
      .select({
        id: users.id,
        telegramUserId: users.telegramUserId,
      })
      .from(users)
      .where(eq(users.id, followingId))
      .limit(1);

    if (!target) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const [actor] = await db
      .select({ firstName: users.firstName })
      .from(users)
      .where(eq(users.id, auth.userId))
      .limit(1);

    const inserted = await db
      .insert(follows)
      .values({
        followerId: auth.userId,
        followingId,
      })
      .onConflictDoNothing({
        target: [follows.followerId, follows.followingId],
      })
      .returning({ id: follows.id });

    if (inserted.length > 0 && actor) {
      notifyNewFollower({
        actorId: auth.userId,
        recipientId: followingId,
        recipientTelegramUserId: target.telegramUserId,
        firstName: actor.firstName,
      });
    }

    return NextResponse.json({ ok: true, following: true });
  } catch (err) {
    console.error('POST /api/users/[id]/follow:', err);
    return NextResponse.json(
      { error: 'Failed to follow', message: String(err) },
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

    const { id: followingId } = await params;

    await db
      .delete(follows)
      .where(
        and(
          eq(follows.followerId, auth.userId),
          eq(follows.followingId, followingId),
        ),
      );

    return NextResponse.json({ ok: true, following: false });
  } catch (err) {
    console.error('DELETE /api/users/[id]/follow:', err);
    return NextResponse.json(
      { error: 'Failed to unfollow', message: String(err) },
      { status: 500 },
    );
  }
}
