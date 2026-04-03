// NOTE: This cron endpoint exists but is NOT scheduled on Hobby plan.
// To enable ±10s accuracy, upgrade to Vercel Pro and add to vercel.json:
// { "crons": [{ "path": "/api/timer/cron", "schedule": "* * * * *" }] }
// On Hobby plan, the client fires /api/timer/fire when the timer reaches zero.
//
// CRON_SECRET env variable must be set in Vercel project settings (Settings → Environment Variables).
// Generate with: openssl rand -hex 32
// Vercel automatically passes it as the Authorization: Bearer <CRON_SECRET> header when invoking this route.

import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { timerSessions, users } from '@/lib/db/schema';
import { and, eq, lte, isNull } from 'drizzle-orm';
import { sendRestEndedMessage } from '@/lib/telegram/notify';

export const maxDuration = 60;

async function checkAndNotify() {
  const now = new Date();
  const db = getDb();

  // Find all expired, unpaused, unnotified timers
  const expired = await db
    .select({
      id: timerSessions.id,
      userId: timerSessions.userId,
      telegramUserId: users.telegramUserId,
    })
    .from(timerSessions)
    .innerJoin(users, eq(timerSessions.userId, users.id))
    .where(
      and(
        lte(timerSessions.endsAt, now),
        eq(timerSessions.paused, false),
        eq(timerSessions.notified, false),
      ),
    );

  for (const session of expired) {
    try {
      if (!session.telegramUserId) continue;

      const msgId = await sendRestEndedMessage(session.telegramUserId);

      await db
        .update(timerSessions)
        .set({
          notified: true,
          telegramMsgId: msgId ?? undefined,
        })
        .where(eq(timerSessions.id, session.id));
    } catch (err) {
      console.error(`[timer/cron] Failed to notify session ${session.id}:`, err);
    }
  }
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export async function GET(req: Request) {
  const secret = req.headers.get('x-cron-secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 6 iterations × 10 seconds = 60 seconds total, ±10s accuracy
  for (let i = 0; i < 6; i++) {
    await checkAndNotify();
    if (i < 5) await sleep(10_000);
  }

  return Response.json({ ok: true });
}
