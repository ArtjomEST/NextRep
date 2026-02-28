import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { workouts, workoutExercises, exercises } from '@/lib/db/schema';
import { eq, desc, sql } from 'drizzle-orm';
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

    const rows = await db
      .select({
        id: exercises.id,
        name: exercises.name,
        category: exercises.category,
        lastUsedAt: sql<string>`max(${workouts.createdAt})::text`,
        usageCount: sql<number>`count(distinct ${workouts.id})::int`,
      })
      .from(workoutExercises)
      .innerJoin(workouts, eq(workoutExercises.workoutId, workouts.id))
      .innerJoin(exercises, eq(workoutExercises.exerciseId, exercises.id))
      .where(eq(workouts.userId, auth.userId))
      .groupBy(exercises.id, exercises.name, exercises.category)
      .orderBy(desc(sql`max(${workouts.createdAt})`));

    const data = rows.map((r) => ({
      id: r.id,
      name: r.name,
      category: r.category,
      lastUsedAt: r.lastUsedAt,
      usageCount: r.usageCount,
    }));

    return NextResponse.json({ data });
  } catch (err) {
    console.error('GET /api/progress/exercises error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch exercises', message: String(err) },
      { status: 500 },
    );
  }
}
