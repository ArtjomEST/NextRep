import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { timerSessions } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { authenticateRequest } from '@/lib/auth/helpers';

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await req.json();
    const { endsAt } = body as { endsAt: string };

    if (!endsAt) {
      return NextResponse.json({ error: 'endsAt is required' }, { status: 400 });
    }

    const db = getDb();

    await db
      .update(timerSessions)
      .set({ endsAt: new Date(endsAt) })
      .where(
        and(
          eq(timerSessions.userId, auth.userId),
          eq(timerSessions.notified, false),
          eq(timerSessions.paused, false),
        ),
      );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('POST /api/timer/update error:', err);
    return NextResponse.json({ error: 'Failed to update timer', message: String(err) }, { status: 500 });
  }
}
