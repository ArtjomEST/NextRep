import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { getDb } from '@/lib/db';
import { userProfiles, promoRedemptions } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { authenticateRequest } from '@/lib/auth/helpers';

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    let body: unknown;
    try { body = await req.json(); } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const rawCode = typeof (body as Record<string, unknown>).code === 'string'
      ? (body as { code: string }).code.trim().toUpperCase()
      : '';

    if (!rawCode) {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 });
    }

    const codeHash = createHash('sha256').update(rawCode).digest('hex');

    const promoHashes = (process.env.PROMO_HASHES ?? '')
      .split(',')
      .map(h => h.trim())
      .filter(Boolean);

    if (!promoHashes.includes(codeHash)) {
      return NextResponse.json({ error: 'Invalid promo code' }, { status: 400 });
    }

    const db = getDb();

    const [alreadyUsed] = await db
      .select({ id: promoRedemptions.id })
      .from(promoRedemptions)
      .where(
        and(
          eq(promoRedemptions.userId, auth.userId),
          eq(promoRedemptions.codeHash, codeHash),
        )
      )
      .limit(1);

    if (alreadyUsed) {
      return NextResponse.json({ error: 'Code already used' }, { status: 400 });
    }

    const [profile] = await db
      .select({ proExpiresAt: userProfiles.proExpiresAt })
      .from(userProfiles)
      .where(eq(userProfiles.userId, auth.userId))
      .limit(1);

    const baseDate = (profile?.proExpiresAt && profile.proExpiresAt > new Date())
      ? profile.proExpiresAt
      : new Date();

    const proExpiresAt = new Date(baseDate);
    proExpiresAt.setDate(proExpiresAt.getDate() + 30);

    await db.update(userProfiles).set({
      proExpiresAt,
      proSource: 'promo',
    }).where(eq(userProfiles.userId, auth.userId));

    await db.insert(promoRedemptions).values({
      userId: auth.userId,
      codeHash,
    });

    return NextResponse.json({
      success: true,
      proExpiresAt: proExpiresAt.toISOString(),
    });
  } catch (err) {
    console.error('POST /api/promo/redeem error:', err);
    return NextResponse.json({ error: 'Failed to redeem code' }, { status: 500 });
  }
}
