import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { workouts, workoutExercises, workoutSets, userProfiles } from '@/lib/db/schema';
import { and, eq, sql } from 'drizzle-orm';
import { authenticateRequest } from '@/lib/auth/helpers';

interface DayEntry {
  dayIndex: number;
  workoutId: string;
  name: string;
  volume: number;
  sets: number;
  durationMinutes: number;
}

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const auth = await authenticateRequest(req);
    if (!auth) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const now = new Date();
    const todayUTCDay = now.getUTCDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    const todayIndex = (todayUTCDay + 6) % 7; // Mon=0 ... Sun=6

    // Monday 00:00:00 UTC of current week
    const weekStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - todayIndex),
    );
    const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
    const lastWeekStart = new Date(weekStart.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Volume aggregation subquery helper: sum(weight*reps) for completed sets
    const volumeExpr = sql<string>`
      coalesce(
        sum(
          case when ${workoutSets.completed} = true
          then coalesce(${workoutSets.weight}::numeric, 0) * coalesce(${workoutSets.reps}, 0)
          else 0 end
        ),
        0
      )
    `;
    const setsCountExpr = sql<number>`
      count(case when ${workoutSets.completed} = true then 1 end)::int
    `;

    const weekFilter = and(
      eq(workouts.userId, auth.userId),
      sql`coalesce(${workouts.startedAt}, ${workouts.createdAt}) >= ${weekStart}`,
      sql`coalesce(${workouts.startedAt}, ${workouts.createdAt}) < ${weekEnd}`,
    );

    const lastWeekFilter = and(
      eq(workouts.userId, auth.userId),
      sql`coalesce(${workouts.startedAt}, ${workouts.createdAt}) >= ${lastWeekStart}`,
      sql`coalesce(${workouts.startedAt}, ${workouts.createdAt}) < ${weekStart}`,
    );

    // Fetch this week's workouts with computed volume and set count
    const weekRows = await db
      .select({
        workoutId: workouts.id,
        name: workouts.name,
        startedAt: workouts.startedAt,
        endedAt: workouts.endedAt,
        durationSec: workouts.durationSec,
        createdAt: workouts.createdAt,
        volume: volumeExpr,
        completedSets: setsCountExpr,
      })
      .from(workouts)
      .leftJoin(workoutExercises, eq(workoutExercises.workoutId, workouts.id))
      .leftJoin(workoutSets, eq(workoutSets.workoutExerciseId, workoutExercises.id))
      .where(weekFilter)
      .groupBy(workouts.id)
      .orderBy(sql`coalesce(${workouts.startedAt}, ${workouts.createdAt}) asc`);

    // Last week total volume (single aggregate, no per-workout breakdown needed)
    const [lastWeekRow] = await db
      .select({ totalVolume: volumeExpr })
      .from(workouts)
      .leftJoin(workoutExercises, eq(workoutExercises.workoutId, workouts.id))
      .leftJoin(workoutSets, eq(workoutSets.workoutExerciseId, workoutExercises.id))
      .where(lastWeekFilter);

    // User profile for session target (default 3)
    const [profile] = await db
      .select({ trainingDaysPerWeek: userProfiles.trainingDaysPerWeek })
      .from(userProfiles)
      .where(eq(userProfiles.userId, auth.userId))
      .limit(1);

    const sessionTarget = profile?.trainingDaysPerWeek ?? 3;

    // Build days array — one entry per day, null = rest day
    const days: (DayEntry | null)[] = Array(7).fill(null);
    let totalVolume = 0;

    for (const row of weekRows) {
      const workoutDate = row.startedAt ?? row.createdAt;
      const dayIndex = (new Date(workoutDate).getUTCDay() + 6) % 7;
      const volume = Number(row.volume ?? 0);

      const durationMinutes =
        row.durationSec != null
          ? Math.round(row.durationSec / 60)
          : row.startedAt && row.endedAt
            ? Math.round(
                (new Date(row.endedAt).getTime() - new Date(row.startedAt).getTime()) / 60000,
              )
            : 0;

      totalVolume += volume;

      // Multiple workouts on same day: keep the one with highest volume
      const existing = days[dayIndex];
      if (!existing || volume > existing.volume) {
        days[dayIndex] = {
          dayIndex,
          workoutId: row.workoutId,
          name: row.name,
          volume,
          sets: Number(row.completedSets ?? 0),
          durationMinutes,
        };
      }
    }

    return NextResponse.json({
      days,
      totalVolume,
      lastWeekVolume: Number(lastWeekRow?.totalVolume ?? 0),
      sessionTarget,
      todayIndex,
    });
  } catch (err) {
    console.error('GET /api/workouts/weekly-volume error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch weekly volume', message: String(err) },
      { status: 500 },
    );
  }
}
