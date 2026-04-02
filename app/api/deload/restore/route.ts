import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { userProfiles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { authenticateRequest } from '@/lib/auth/helpers';

export async function PATCH(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const db = getDb();

    await db
      .update(userProfiles)
      .set({ deloadHidden: false, deloadDismissCount: 0 })
      .where(eq(userProfiles.userId, auth.userId));

    return NextResponse.json({ data: { hidden: false } });
  } catch (err) {
    console.error('PATCH /api/deload/restore error:', err);
    return NextResponse.json({ error: 'Failed to restore', message: String(err) }, { status: 500 });
  }
}
