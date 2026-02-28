import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { authenticateRequest } from '@/lib/auth/helpers';

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const auth = await authenticateRequest(req);
    if (!auth) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 },
      );
    }

    await db
      .update(users)
      .set({ isLinked: true })
      .where(eq(users.id, auth.userId));

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[POST /api/me/link] userId=${auth.userId} linked`);
    }

    return NextResponse.json({ data: { isLinked: true } });
  } catch (err) {
    console.error('POST /api/me/link error:', err);
    return NextResponse.json(
      { error: 'Failed to link account', message: String(err) },
      { status: 500 },
    );
  }
}
