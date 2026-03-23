import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { exercises } from '@/lib/db/schema';
import { authenticateRequest } from '@/lib/auth/helpers';
import { and, inArray, sql } from 'drizzle-orm';

const SYNONYMS: Record<string, string> = {
  бицепс: 'bicep',
  трицепс: 'tricep',
  грудь: 'chest',
  спина: 'back',
  плечи: 'shoulder',
  ноги: 'leg',
  жим: 'press',
  тяга: 'row',
  присед: 'squat',
  подтягивания: 'pull-up',
  отжимания: 'push-up',
};

function normalizeQuery(q: string): string {
  const lower = q.toLowerCase().trim();
  return SYNONYMS[lower] ?? lower;
}

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = req.nextUrl;

    const namesRaw = searchParams.get('names');
    if (namesRaw != null && namesRaw.trim() !== '') {
      const nameList = namesRaw
        .split(',')
        .map((s) => decodeURIComponent(s.trim()))
        .filter(Boolean);
      if (nameList.length > 0) {
        const rows = await db
          .select()
          .from(exercises)
          .where(inArray(exercises.name, nameList));
        const byName = new Map(rows.map((r) => [r.name, r]));
        const ordered = nameList
          .map((n) => byName.get(n))
          .filter((r): r is (typeof rows)[number] => r != null);
        return NextResponse.json({
          data: ordered,
          total: ordered.length,
          limit: ordered.length,
          offset: 0,
        });
      }
    }

    const query = normalizeQuery(searchParams.get('q') ?? '');
    const category = searchParams.get('category');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 200);
    const offset = Math.max(parseInt(searchParams.get('offset') ?? '0'), 0);
    const myExercises = searchParams.get('myExercises') === 'true';

    let auth: Awaited<ReturnType<typeof authenticateRequest>> = null;
    if (myExercises) {
      auth = await authenticateRequest(req);
      if (!auth) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 },
        );
      }
    }

    const conditions: ReturnType<typeof sql>[] = [];

    if (query.length > 0) {
      conditions.push(
        sql`(${exercises.name} % ${query} OR ${exercises.name} ILIKE ${'%' + query + '%'})`,
      );
    }

    if (category) {
      conditions.push(sql`${exercises.category} ILIKE ${category}`);
    }

    if (myExercises && auth) {
      conditions.push(
          sql`${exercises.id} IN (
            SELECT DISTINCT we.exercise_id
            FROM workout_exercises we
            JOIN workouts w ON we.workout_id = w.id
            WHERE w.user_id = ${auth.userId}
          )`,
      );
    }

    const where =
      conditions.length > 0
        ? conditions.length === 1
          ? conditions[0]
          : and(...conditions)
        : undefined;

    const [rows, countResult] = await Promise.all([
      db
        .select()
        .from(exercises)
        .where(where)
        .orderBy(
          ...(query.length > 0
            ? [sql`similarity(${exercises.name}, ${query}) DESC`, exercises.name]
            : [exercises.name]),
        )
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(exercises)
        .where(where),
    ]);

    return NextResponse.json({
      data: rows,
      total: Number(countResult[0]?.count ?? 0),
      limit,
      offset,
    });
  } catch (err) {
    console.error('GET /api/exercises error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch exercises', message: String(err) },
      { status: 500 },
    );
  }
}
