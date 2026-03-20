import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { userProfiles, users } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { authenticateRequest } from '@/lib/auth/helpers';

type UserProfileInsert = typeof userProfiles.$inferInsert;
type ProfileUpsertFields = Omit<
  Partial<UserProfileInsert>,
  'id' | 'userId'
>;

/**
 * Fills NOT NULL columns with literals so INSERT/UPSERT never relies on SQL DEFAULT.
 * (Some DBs had is_pro NOT NULL without a server default.)
 */
function withProfileWriteDefaults(
  patch: ProfileUpsertFields,
  onboardingCompleted: boolean,
): ProfileUpsertFields {
  return {
    ...patch,
    onboardingCompleted,
    isPro: false,
    units: patch.units ?? 'kg',
  };
}

/**
 * INSERT-only: avoid SQL DEFAULT for is_pro/units. Do not use in UPDATE — breaks param order with Neon.
 */
function forcedNotNullLiteralsForInsert(upsertFields: ProfileUpsertFields) {
  const u = upsertFields.units ?? 'kg';
  return {
    isPro: sql`false`,
    units: u === 'lb' ? sql.raw(`'lb'::units`) : sql.raw(`'kg'::units`),
  };
}

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

function isPostgresUniqueViolation(err: unknown): boolean {
  const o = err as { code?: string; cause?: { code?: string } };
  if (o?.code === '23505' || o?.cause?.code === '23505') return true;
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes('23505') ||
    /duplicate key|unique constraint/i.test(msg)
  );
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

    const raw = await req.json();
    const body =
      raw && typeof raw === 'object' && !Array.isArray(raw)
        ? (raw as Record<string, unknown>)
        : {};
    const db = getDb();

    const patch = buildProfilePatch(body);
    const upsertFields = withProfileWriteDefaults(patch, true);
    const insertOnlyLiterals = forcedNotNullLiteralsForInsert(upsertFields);
    const valuesForInsert = {
      userId: auth.userId,
      ...upsertFields,
      ...insertOnlyLiterals,
    };
    // UPDATE: omit is_pro and units so Drizzle emits only bound params (mixed literals break Neon).
    const { isPro: _ip, units: _un, ...updateRest } = upsertFields;
    const valuesForUpdate = {
      ...updateRest,
      updatedAt: new Date(),
    };

    const [existsUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, auth.userId))
      .limit(1);

    if (!existsUser) {
      return NextResponse.json(
        {
          error: 'Failed to save profile',
          message:
            'Your account was not found in the database. Close the mini app and open it again.',
        },
        { status: 400 },
      );
    }

    const [updated] = await db
      .update(userProfiles)
      .set(valuesForUpdate)
      .where(eq(userProfiles.userId, auth.userId))
      .returning();

    let row = updated;

    if (!row) {
      try {
        const [inserted] = await db
          .insert(userProfiles)
          .values(valuesForInsert)
          .returning();
        row = inserted;
      } catch (insErr) {
        if (isPostgresUniqueViolation(insErr)) {
          const [again] = await db
            .update(userProfiles)
            .set(valuesForUpdate)
            .where(eq(userProfiles.userId, auth.userId))
            .returning();
          row = again;
        } else {
          throw insErr;
        }
      }
    }

    if (!row) {
      const [fallback] = await db
        .select()
        .from(userProfiles)
        .where(eq(userProfiles.userId, auth.userId))
        .limit(1);
      row = fallback;
    }

    if (!row) {
      return NextResponse.json(
        {
          error: 'Failed to save profile',
          message: 'No row returned after save',
        },
        { status: 500 },
      );
    }

    return NextResponse.json({ data: serializeProfile(row) }, { status: 201 });
  } catch (err) {
    console.error('POST /api/profile error:', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: 'Failed to save profile', message },
      { status: 500 },
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const raw = await req.json();
    const body =
      raw && typeof raw === 'object' && !Array.isArray(raw)
        ? (raw as Record<string, unknown>)
        : {};
    const db = getDb();

    const patch = buildProfilePatch(body);

    const [existing] = await db
      .select({ id: userProfiles.id })
      .from(userProfiles)
      .where(eq(userProfiles.userId, auth.userId))
      .limit(1);

    let profileRow: typeof userProfiles.$inferSelect | undefined;

    if (existing) {
      if (Object.keys(patch).length > 0) {
        const [row] = await db
          .update(userProfiles)
          .set(patch)
          .where(eq(userProfiles.userId, auth.userId))
          .returning();
        profileRow = row;
      } else {
        const [row] = await db
          .select()
          .from(userProfiles)
          .where(eq(userProfiles.userId, auth.userId))
          .limit(1);
        profileRow = row;
      }
    } else {
      const insertFields = withProfileWriteDefaults(patch, true);
      const lit = forcedNotNullLiteralsForInsert(insertFields);
      const [row] = await db
        .insert(userProfiles)
        .values({
          userId: auth.userId,
          ...insertFields,
          ...lit,
        })
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
        { error: 'Failed to update profile', message: 'No row returned' },
        { status: 500 },
      );
    }

    return NextResponse.json({ data: serializeProfile(profileRow) });
  } catch (err) {
    console.error('PUT /api/profile error:', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: 'Failed to update profile', message },
      { status: 500 },
    );
  }
}

function buildProfilePatch(body: Record<string, unknown>): ProfileUpsertFields {
  const values: ProfileUpsertFields = {};

  if ('goal' in body && isGoal(body.goal)) values.goal = body.goal;
  if ('experienceLevel' in body && isExperience(body.experienceLevel)) {
    values.experienceLevel = body.experienceLevel;
  }

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
