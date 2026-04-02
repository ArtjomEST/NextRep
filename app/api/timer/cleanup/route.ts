import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { timerSessions, users } from '@/lib/db/schema';
import { eq, and, isNotNull } from 'drizzle-orm';
import { authenticateRequest } from '@/lib/auth/helpers';
import { deleteMessage } from '@/lib/telegram/notify';

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await req.json();
    const { workoutId } = body as { workoutId: string };

    if (!workoutId) {
      return NextResponse.json({ error: 'workoutId is required' }, { status: 400 });
    }

    const db = getDb();

    // Get telegramUserId for deleting messages
    const [user] = await db
      .select({ telegramUserId: users.telegramUserId })
      .from(users)
      .where(eq(users.id, auth.userId))
      .limit(1);

    // Delete Telegram messages for sessions that sent a notification
    if (user?.telegramUserId) {
      const sessions = await db
        .select({ telegramMsgId: timerSessions.telegramMsgId })
        .from(timerSessions)
        .where(
          and(
            eq(timerSessions.workoutId, workoutId),
            eq(timerSessions.userId, auth.userId),
            isNotNull(timerSessions.telegramMsgId),
          ),
        );

      for (const session of sessions) {
        if (session.telegramMsgId !== null) {
          await deleteMessage(user.telegramUserId, session.telegramMsgId).catch(console.error);
        }
      }
    }

    // Delete all timer sessions for this workout + user
    const result = await db
      .delete(timerSessions)
      .where(
        and(
          eq(timerSessions.workoutId, workoutId),
          eq(timerSessions.userId, auth.userId),
        ),
      )
      .returning({ id: timerSessions.id });

    return NextResponse.json({ ok: true, deleted: result.length });
  } catch (err) {
    console.error('POST /api/timer/cleanup error:', err);
    return NextResponse.json({ error: 'Failed to cleanup timer', message: String(err) }, { status: 500 });
  }
}
