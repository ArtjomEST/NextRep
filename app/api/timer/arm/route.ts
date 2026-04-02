import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { timerSessions, users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { authenticateRequest } from '@/lib/auth/helpers';

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await req.json();
    const { workoutId, durationSeconds } = body as { workoutId: string; durationSeconds: number };

    if (!workoutId || typeof durationSeconds !== 'number') {
      return NextResponse.json({ error: 'workoutId and durationSeconds are required' }, { status: 400 });
    }

    const db = getDb();

    // Get telegramUserId to ensure user has one (needed for notifications)
    const [user] = await db
      .select({ telegramUserId: users.telegramUserId })
      .from(users)
      .where(eq(users.id, auth.userId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Delete any existing non-notified sessions for this user (clean slate)
    await db
      .delete(timerSessions)
      .where(
        and(
          eq(timerSessions.userId, auth.userId),
          eq(timerSessions.notified, false),
        ),
      );

    const endsAt = new Date(Date.now() + durationSeconds * 1000);

    await db.insert(timerSessions).values({
      userId: auth.userId,
      workoutId,
      endsAt,
      paused: false,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('POST /api/timer/arm error:', err);
    return NextResponse.json({ error: 'Failed to arm timer', message: String(err) }, { status: 500 });
  }
}
