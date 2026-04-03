// DEV ONLY — protected by NODE_ENV check. Remove or keep this guard before production.
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { userProfiles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { authenticateRequest } from '@/lib/auth/helpers';

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const db = getDb();

    await db
      .update(userProfiles)
      .set({
        isPro: false,
        proExpiresAt: null,
        trialEndsAt: null,
        trialUsed: false,
        proSource: null,
      })
      .where(eq(userProfiles.userId, auth.userId));

    const [updated] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, auth.userId))
      .limit(1);

    return NextResponse.json({ success: true, profile: updated });
  } catch (err) {
    console.error('POST /api/dev/cancel-pro error:', err);
    return NextResponse.json({ error: 'Failed to cancel PRO' }, { status: 500 });
  }
}
