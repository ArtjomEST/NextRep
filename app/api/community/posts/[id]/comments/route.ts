import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { communityPosts, postComments, users } from '@/lib/db/schema';
import { eq, asc, count as drizzleCount } from 'drizzle-orm';
import { authenticateRequest } from '@/lib/auth/helpers';
import { notifyPostCommented } from '@/lib/telegram/notify';
import { displayUserName } from '@/lib/users/display';

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

    const { id: postId } = await params;
    const limit = Math.min(
      parseInt(req.nextUrl.searchParams.get('limit') ?? '30', 10),
      100,
    );
    const offset = Math.max(
      parseInt(req.nextUrl.searchParams.get('offset') ?? '0', 10),
      0,
    );

    const [p] = await db
      .select({ id: communityPosts.id })
      .from(communityPosts)
      .where(eq(communityPosts.id, postId))
      .limit(1);

    if (!p) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const rows = await db
      .select({
        id: postComments.id,
        text: postComments.text,
        createdAt: postComments.createdAt,
        userId: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        username: users.username,
        avatarUrl: users.avatarUrl,
      })
      .from(postComments)
      .innerJoin(users, eq(postComments.userId, users.id))
      .where(eq(postComments.postId, postId))
      .orderBy(asc(postComments.createdAt))
      .limit(limit)
      .offset(offset);

    const [totalRow] = await db
      .select({ c: drizzleCount() })
      .from(postComments)
      .where(eq(postComments.postId, postId));

    const data = rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      userName: displayUserName({
        firstName: r.firstName,
        lastName: r.lastName,
        username: r.username,
      }),
      userAvatarUrl: r.avatarUrl,
      text: r.text,
      createdAt: r.createdAt.toISOString(),
    }));

    return NextResponse.json({
      data,
      total: Number(totalRow?.c ?? 0),
      limit,
      offset,
    });
  } catch (err) {
    console.error('GET /api/community/posts/[id]/comments:', err);
    return NextResponse.json(
      { error: 'Failed to load comments', message: String(err) },
      { status: 500 },
    );
  }
}

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

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const text =
      typeof body === 'object' &&
      body &&
      typeof (body as { text?: unknown }).text === 'string'
        ? (body as { text: string }).text.trim()
        : '';

    if (text.length === 0) {
      return NextResponse.json(
        { error: 'Comment text is required' },
        { status: 400 },
      );
    }
    if (text.length > 280) {
      return NextResponse.json(
        { error: 'Comment must be 280 characters or less' },
        { status: 400 },
      );
    }

    const [inserted] = await db
      .insert(postComments)
      .values({
        userId: auth.userId,
        postId,
        text,
      })
      .returning({
        id: postComments.id,
        createdAt: postComments.createdAt,
      });

    if (p.userId !== auth.userId) {
      const [owner, commenter] = await Promise.all([
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
      if (owner && commenter) {
        notifyPostCommented({
          actorId: auth.userId,
          recipientId: p.userId,
          recipientTelegramUserId: owner.telegramUserId,
          firstName: commenter.firstName,
          commentText: text,
        });
      }
    }

    const [me] = await db
      .select({
        firstName: users.firstName,
        lastName: users.lastName,
        username: users.username,
        avatarUrl: users.avatarUrl,
      })
      .from(users)
      .where(eq(users.id, auth.userId))
      .limit(1);

    return NextResponse.json({
      data: {
        id: inserted!.id,
        userId: auth.userId,
        userName: me ? displayUserName(me) : 'You',
        userAvatarUrl: me?.avatarUrl ?? null,
        text,
        createdAt: inserted!.createdAt.toISOString(),
      },
    });
  } catch (err) {
    console.error('POST /api/community/posts/[id]/comments:', err);
    return NextResponse.json(
      { error: 'Failed to post comment', message: String(err) },
      { status: 500 },
    );
  }
}
