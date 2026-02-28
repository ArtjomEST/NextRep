import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { workouts } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { authenticateRequest } from '@/lib/auth/helpers';

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

    const [row] = await db
      .select({
        total: sql<number>`count(*)::int`,
        totalVolume: sql<string>`coalesce(sum(${workouts.totalVolume}), 0)::text`,
        totalSets: sql<number>`coalesce(sum(${workouts.totalSets}), 0)::int`,
      })
      .from(workouts)
      .where(eq(workouts.userId, auth.userId));

    return NextResponse.json({
      data: {
        total: Number(row?.total ?? 0),
        totalVolume: Number(row?.totalVolume ?? 0),
        totalSets: Number(row?.totalSets ?? 0),
      },
    });
  } catch (err) {
    console.error('GET /api/workouts/stats error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch stats', message: String(err) },
      { status: 500 },
    );
  }
}
