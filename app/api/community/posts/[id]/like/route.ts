import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { communityPosts, postLikes, users } from '@/lib/db/schema';
import { eq, and, count as drizzleCount } from 'drizzle-orm';
import { authenticateRequest } from '@/lib/auth/helpers';
import { notifyPostLiked } from '@/lib/telegram/notify';

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

    const { id: postId } = await params;

    const [p] = await db
      .select({
        id: communityPosts.id,
        userId: communityPosts.userId,
      })
      .from(communityPosts)
      .where(eq(communityPosts.id, postId))
      .limit(1);

    if (!p) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const [existing] = await db
      .select({ id: postLikes.id })
      .from(postLikes)
      .where(
        and(
          eq(postLikes.userId, auth.userId),
          eq(postLikes.postId, postId),
        ),
      )
      .limit(1);

    if (existing) {
      await db
        .delete(postLikes)
        .where(
          and(
            eq(postLikes.userId, auth.userId),
            eq(postLikes.postId, postId),
          ),
        );
    } else {
      await db.insert(postLikes).values({
        userId: auth.userId,
        postId,
      });

      if (p.userId !== auth.userId) {
        const [owner, liker] = await Promise.all([
          db
            .select({ telegramUserId: users.telegramUserId })
            .from(users)
            .where(eq(users.id, p.userId))
            .limit(1)
            .then((r) => r[0]),
          db
            .select({ firstName: users.firstName })
            .from(users)
            .where(eq(users.id, auth.userId))
            .limit(1)
            .then((r) => r[0]),
        ]);
        if (owner && liker) {
          notifyPostLiked({
            actorId: auth.userId,
            recipientId: p.userId,
            recipientTelegramUserId: owner.telegramUserId,
            firstName: liker.firstName,
          });
        }
      }
    }

    const [cnt] = await db
      .select({ c: drizzleCount() })
      .from(postLikes)
      .where(eq(postLikes.postId, postId));

    return NextResponse.json({
      liked: !existing,
      likeCount: Number(cnt?.c ?? 0),
    });
  } catch (err) {
    console.error('POST /api/community/posts/[id]/like:', err);
    return NextResponse.json(
      { error: 'Failed to toggle like', message: String(err) },
      { status: 500 },
    );
  }
}
