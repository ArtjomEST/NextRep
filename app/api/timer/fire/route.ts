import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { timerSessions, users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { authenticateRequest } from '@/lib/auth/helpers';
import { sendRestEndedMessage } from '@/lib/telegram/notify';

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDb();

    const [session] = await db
      .select({
        id: timerSessions.id,
        telegramUserId: users.telegramUserId,
      })
      .from(timerSessions)
      .innerJoin(users, eq(timerSessions.userId, users.id))
      .where(
        and(
          eq(timerSessions.userId, auth.userId),
          eq(timerSessions.notified, false),
          eq(timerSessions.paused, false),
        ),
      )
      .limit(1);

    if (!session?.telegramUserId) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const msgId = await sendRestEndedMessage(session.telegramUserId);

    await db
      .update(timerSessions)
      .set({ notified: true, telegramMsgId: msgId ?? undefined })
      .where(eq(timerSessions.id, session.id));

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('POST /api/timer/fire error:', err);
    return NextResponse.json({ error: 'Failed to fire timer', message: String(err) }, { status: 500 });
  }
}
