import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { timerSessions, users, userProfiles } from '@/lib/db/schema';
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
        timerNotificationsEnabled: userProfiles.timerNotificationsEnabled,
      })
      .from(timerSessions)
      .innerJoin(users, eq(timerSessions.userId, users.id))
      .leftJoin(userProfiles, eq(timerSessions.userId, userProfiles.userId))
      .where(
        and(
          eq(timerSessions.userId, auth.userId),
          eq(timerSessions.notified, false),
          eq(timerSessions.paused, false),
        ),
      )
      .limit(1);

    if (!session) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    // Always mark notified so we clean up the session, but skip the message if disabled
    let msgId: number | null = null;
    if (session.telegramUserId && session.timerNotificationsEnabled !== false) {
      msgId = await sendRestEndedMessage(session.telegramUserId);
    }

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
