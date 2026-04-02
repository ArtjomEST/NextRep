import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { userProfiles } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { authenticateRequest } from '@/lib/auth/helpers';

export async function PATCH(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const db = getDb();

    // Ensure profile row exists
    const [profile] = await db
      .select({ id: userProfiles.id, deloadDismissCount: userProfiles.deloadDismissCount })
      .from(userProfiles)
      .where(eq(userProfiles.userId, auth.userId))
      .limit(1);

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const newCount = (profile.deloadDismissCount ?? 0) + 1;
    const shouldHide = newCount >= 3;

    await db
      .update(userProfiles)
      .set({
        deloadDismissCount: sql`${userProfiles.deloadDismissCount} + 1`,
        deloadHidden: shouldHide,
      })
      .where(eq(userProfiles.userId, auth.userId));

    return NextResponse.json({ data: { hidden: shouldHide, dismissCount: newCount } });
  } catch (err) {
    console.error('PATCH /api/deload/dismiss error:', err);
    return NextResponse.json({ error: 'Failed to dismiss', message: String(err) }, { status: 500 });
  }
}
