import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { userProfiles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { authenticateRequest } from '@/lib/auth/helpers';

const GOAL_VALUES = ['muscle_growth', 'strength', 'endurance', 'weight_loss', 'general_fitness'] as const;
const EXPERIENCE_VALUES = ['beginner', 'intermediate', 'advanced'] as const;
type GoalValue = typeof GOAL_VALUES[number];
type ExperienceValue = typeof EXPERIENCE_VALUES[number];

function isGoal(v: unknown): v is GoalValue {
  return typeof v === 'string' && (GOAL_VALUES as readonly string[]).includes(v);
}
function isExperience(v: unknown): v is ExperienceValue {
  return typeof v === 'string' && (EXPERIENCE_VALUES as readonly string[]).includes(v);
}

export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const db = getDb();
    const [profile] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, auth.userId))
      .limit(1);

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json({ data: serializeProfile(profile) });
  } catch (err) {
    console.error('GET /api/profile error:', err);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await req.json();
    const db = getDb();

    const values = buildProfileValues(body);
    values.onboardingCompleted = true;

    const [existing] = await db
      .select({ id: userProfiles.id })
      .from(userProfiles)
      .where(eq(userProfiles.userId, auth.userId))
      .limit(1);

    let profileRow: typeof userProfiles.$inferSelect | undefined;

    if (existing) {
      const [row] = await db
        .update(userProfiles)
        .set(values)
        .where(eq(userProfiles.userId, auth.userId))
        .returning();
      profileRow = row;
    } else {
      const [row] = await db
        .insert(userProfiles)
        .values({ userId: auth.userId, ...values })
        .returning();
      profileRow = row;
    }

    if (!profileRow) {
      const [fallback] = await db
        .select()
        .from(userProfiles)
        .where(eq(userProfiles.userId, auth.userId))
        .limit(1);
      profileRow = fallback;
    }

    if (!profileRow) {
      return NextResponse.json(
        { error: 'Failed to save profile' },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { data: serializeProfile(profileRow) },
      { status: 201 },
    );
  } catch (err) {
    console.error('POST /api/profile error:', err);
    return NextResponse.json({ error: 'Failed to save profile' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await req.json();
    const db = getDb();

    const values = buildProfileValues(body);

    const [existing] = await db
      .select({ id: userProfiles.id })
      .from(userProfiles)
      .where(eq(userProfiles.userId, auth.userId))
      .limit(1);

    let profileRow: typeof userProfiles.$inferSelect | undefined;

    if (existing) {
      const [row] = await db
        .update(userProfiles)
        .set(values)
        .where(eq(userProfiles.userId, auth.userId))
        .returning();
      profileRow = row;
    } else {
      const [row] = await db
        .insert(userProfiles)
        .values({ userId: auth.userId, ...values, onboardingCompleted: true })
        .returning();
      profileRow = row;
    }

    if (!profileRow) {
      const [fallback] = await db
        .select()
        .from(userProfiles)
        .where(eq(userProfiles.userId, auth.userId))
        .limit(1);
      profileRow = fallback;
    }

    if (!profileRow) {
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 },
      );
    }

    return NextResponse.json({ data: serializeProfile(profileRow) });
  } catch (err) {
    console.error('PUT /api/profile error:', err);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildProfileValues(body: Record<string, any>) {
  const values: Record<string, unknown> = {};

  if ('goal' in body && isGoal(body.goal)) values.goal = body.goal;
  if ('experienceLevel' in body && isExperience(body.experienceLevel)) values.experienceLevel = body.experienceLevel;

  if ('splitPreference' in body && typeof body.splitPreference === 'string') {
    values.splitPreference = body.splitPreference.slice(0, 32);
  }
  if ('trainingDaysPerWeek' in body) {
    const v = Number(body.trainingDaysPerWeek);
    if (!isNaN(v) && v >= 1 && v <= 7) values.trainingDaysPerWeek = v;
  }
  if ('heightCm' in body) {
    const v = Number(body.heightCm);
    if (!isNaN(v) && v >= 50 && v <= 300) values.heightCm = v;
    else if (body.heightCm === null) values.heightCm = null;
  }
  if ('weightKg' in body) {
    const v = Number(body.weightKg);
    if (!isNaN(v) && v >= 20 && v <= 700) values.weightKg = String(v);
    else if (body.weightKg === null) values.weightKg = null;
  }
  if ('age' in body) {
    const v = Number(body.age);
    if (!isNaN(v) && v >= 10 && v <= 120) values.age = v;
    else if (body.age === null) values.age = null;
  }
  if ('bestLifts' in body) {
    values.bestLifts = body.bestLifts ?? null;
  }
  if ('injuries' in body) {
    values.injuries = Array.isArray(body.injuries) ? body.injuries : null;
  }
  if ('units' in body && (body.units === 'kg' || body.units === 'lb')) {
    values.units = body.units;
  }

  return values;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serializeProfile(profile: any) {
  return {
    userId: profile.userId,
    goal: profile.goal ?? null,
    experienceLevel: profile.experienceLevel ?? null,
    splitPreference: profile.splitPreference ?? null,
    trainingDaysPerWeek: profile.trainingDaysPerWeek ?? null,
    heightCm: profile.heightCm ?? null,
    weightKg: profile.weightKg ?? null,
    age: profile.age ?? null,
    units: profile.units ?? 'kg',
    bestLifts: profile.bestLifts ?? null,
    injuries: profile.injuries ?? null,
    onboardingCompleted: profile.onboardingCompleted ?? false,
    createdAt: profile.createdAt ?? null,
    updatedAt: profile.updatedAt ?? null,
  };
}
