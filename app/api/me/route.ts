import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { users, userProfiles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { authenticateRequest } from '@/lib/auth/helpers';
import { computeIsPro } from '@/lib/pro/helpers';

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const auth = await authenticateRequest(req);
    if (!auth) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 },
      );
    }

    const [user] = await db
      .select({
        id: users.id,
        username: users.username,
        firstName: users.firstName,
        lastName: users.lastName,
        avatarUrl: users.avatarUrl,
        isLinked: users.isLinked,
        telegramUserId: users.telegramUserId,
      })
      .from(users)
      .where(eq(users.id, auth.userId))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 },
      );
    }

    const [profile] = await db
      .select({
        proExpiresAt: userProfiles.proExpiresAt,
        trialEndsAt: userProfiles.trialEndsAt,
        trialUsed: userProfiles.trialUsed,
      })
      .from(userProfiles)
      .where(eq(userProfiles.userId, auth.userId))
      .limit(1);

    return NextResponse.json({
      data: {
        ...user,
        isPro: computeIsPro(profile ?? {}),
        proExpiresAt: profile?.proExpiresAt?.toISOString() ?? null,
        trialEndsAt: profile?.trialEndsAt?.toISOString() ?? null,
        trialUsed: profile?.trialUsed ?? false,
      },
    });
  } catch (err) {
    console.error('GET /api/me error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch user', message: String(err) },
      { status: 500 },
    );
  }
}
