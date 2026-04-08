import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { userProfiles } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { authenticateRequest } from '@/lib/auth/helpers';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serializeSettings(profile: any) {
  return {
    userId: profile.userId,
    heightCm: profile.heightCm ?? null,
    weightKg: profile.weightKg ?? null,
    age: profile.age ?? null,
    units: profile.units ?? 'kg',
    experienceLevel: profile.experienceLevel ?? null,
    goal: profile.goal ?? null,
    splitPreference: profile.splitPreference ?? null,
    trainingDaysPerWeek: profile.trainingDaysPerWeek ?? null,
    bestLifts: profile.bestLifts ?? null,
    injuries: profile.injuries ?? null,
    onboardingCompleted: profile.onboardingCompleted ?? false,
    timerNotificationsEnabled: profile.timerNotificationsEnabled ?? true,
  };
}

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const auth = await authenticateRequest(req);
    if (!auth) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const [profile] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, auth.userId))
      .limit(1);

    return NextResponse.json({
      data: profile ? serializeSettings(profile) : {
        userId: auth.userId,
        heightCm: null,
        weightKg: null,
        age: null,
        units: 'kg',
        experienceLevel: null,
        goal: null,
        splitPreference: null,
        trainingDaysPerWeek: null,
        bestLifts: null,
        injuries: null,
        onboardingCompleted: false,
        timerNotificationsEnabled: true,
      },
    });
  } catch (err) {
    console.error('GET /api/me/settings error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch settings', message: String(err) },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const db = getDb();
    const auth = await authenticateRequest(req);
    if (!auth) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await req.json();

    const allowed = ['heightCm', 'weightKg', 'age', 'units', 'experienceLevel', 'goal', 'splitPreference', 'trainingDaysPerWeek', 'bestLifts', 'injuries', 'timerNotificationsEnabled'] as const;
    const updates: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) {
        updates[key] = body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const [existing] = await db
      .select({ id: userProfiles.id })
      .from(userProfiles)
      .where(eq(userProfiles.userId, auth.userId))
      .limit(1);

    if (existing) {
      await db
        .update(userProfiles)
        .set(updates)
        .where(eq(userProfiles.userId, auth.userId));
    } else {
      const u =
        updates.units === 'lb' || updates.units === 'kg'
          ? updates.units
          : 'kg';
      await db.insert(userProfiles).values({
        userId: auth.userId,
        ...updates,
        isPro: sql`false`,
        onboardingCompleted: false,
        units: u === 'lb' ? sql.raw(`'lb'::units`) : sql.raw(`'kg'::units`),
      });
    }

    const [profile] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, auth.userId))
      .limit(1);

    return NextResponse.json({ data: serializeSettings(profile) });
  } catch (err) {
    console.error('PATCH /api/me/settings error:', err);
    return NextResponse.json(
      { error: 'Failed to update settings', message: String(err) },
      { status: 500 },
    );
  }
}
