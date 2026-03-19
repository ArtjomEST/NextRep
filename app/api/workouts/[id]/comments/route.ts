import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import {
  workouts,
  workoutComments,
  users,
} from '@/lib/db/schema';
import { eq, and, asc, isNotNull, count as drizzleCount } from 'drizzle-orm';
import { authenticateRequest } from '@/lib/auth/helpers';
import { notifyTelegramUser } from '@/lib/telegram/notify';
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

    const { id: workoutId } = await params;
    const limit = Math.min(
      parseInt(req.nextUrl.searchParams.get('limit') ?? '30', 10),
      100,
    );
    const offset = Math.max(
      parseInt(req.nextUrl.searchParams.get('offset') ?? '0', 10),
      0,
    );

    const [w] = await db
      .select({ id: workouts.id })
      .from(workouts)
      .where(
        and(
          eq(workouts.id, workoutId),
          eq(workouts.isPublic, true),
          isNotNull(workouts.endedAt),
        ),
      )
      .limit(1);

    if (!w) {
      return NextResponse.json(
        { error: 'Workout not found' },
        { status: 404 },
      );
    }

    const rows = await db
      .select({
        id: workoutComments.id,
        text: workoutComments.text,
        createdAt: workoutComments.createdAt,
        userId: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        username: users.username,
        avatarUrl: users.avatarUrl,
      })
      .from(workoutComments)
      .innerJoin(users, eq(workoutComments.userId, users.id))
      .where(eq(workoutComments.workoutId, workoutId))
      .orderBy(asc(workoutComments.createdAt))
      .limit(limit)
      .offset(offset);

    const [totalRow] = await db
      .select({ c: drizzleCount() })
      .from(workoutComments)
      .where(eq(workoutComments.workoutId, workoutId));

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
    console.error('GET /api/workouts/[id]/comments:', err);
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
      .insert(workoutComments)
      .values({
        userId: auth.userId,
        workoutId,
        text,
      })
      .returning({
        id: workoutComments.id,
        createdAt: workoutComments.createdAt,
      });

    if (w.userId !== auth.userId) {
      const [owner, commenter] = await Promise.all([
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
      if (owner && commenter) {
        const preview =
          text.length <= 60 ? text : `${text.slice(0, 60)}…`;
        notifyTelegramUser(
          owner.telegramUserId,
          `💬 ${displayUserName(commenter)}: ${preview}`,
        );
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
    console.error('POST /api/workouts/[id]/comments:', err);
    return NextResponse.json(
      { error: 'Failed to post comment', message: String(err) },
      { status: 500 },
    );
  }
}
