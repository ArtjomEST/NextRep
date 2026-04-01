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
    const [profile] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, auth.userId))
      .limit(1);

    if (profile?.trialUsed) {
      return NextResponse.json({ error: 'Trial already used' }, { status: 400 });
    }

    if (profile?.proExpiresAt != null && profile.proExpiresAt > new Date()) {
      return NextResponse.json({ error: 'Already PRO' }, { status: 400 });
    }

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 7);

    await db
      .update(userProfiles)
      .set({
        trialEndsAt,
        trialUsed: true,
        proSource: 'trial',
      })
      .where(eq(userProfiles.userId, auth.userId));

    return NextResponse.json({
      success: true,
      trialEndsAt: trialEndsAt.toISOString(),
    });
  } catch (err) {
    console.error('POST /api/trial/activate error:', err);
    return NextResponse.json({ error: 'Failed to activate trial' }, { status: 500 });
  }
}
