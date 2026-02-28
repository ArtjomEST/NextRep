import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { exercises } from '@/lib/db/schema';
import { ilike, and, sql } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = req.nextUrl;
    const query = searchParams.get('q') ?? '';
    const category = searchParams.get('category');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 200);
    const offset = Math.max(parseInt(searchParams.get('offset') ?? '0'), 0);

    const conditions = [];

    if (query.length > 0) {
      conditions.push(ilike(exercises.name, `%${query}%`));
    }

    if (category) {
      conditions.push(ilike(exercises.category, category));
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
        .orderBy(exercises.name)
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
