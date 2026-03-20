import type { Database } from '@/lib/db';
import {
  users,
  workouts,
  workoutExercises,
  workoutSets,
  exercises,
} from '@/lib/db/schema';
import { eq, desc, sql, inArray, asc, and } from 'drizzle-orm';

function utcDayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Consecutive calendar days with a workout, counting back from the most recent session day. */
export function workoutStreakFromDayKeys(dayKeys: string[]): number {
  if (dayKeys.length === 0) return 0;
  const set = new Set(dayKeys);
  const sorted = [...dayKeys].sort();
  let cursor = new Date(sorted[sorted.length - 1] + 'T12:00:00.000Z');
  let streak = 0;
  while (set.has(utcDayKey(cursor))) {
    streak += 1;
    cursor = new Date(cursor.getTime() - 24 * 60 * 60 * 1000);
  }
  return streak;
}

export async function buildCoachContextBlock(
  db: Database,
  userId: string,
): Promise<string> {
  const [user] = await db
    .select({ firstName: users.firstName })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const firstName = user?.firstName?.trim() || 'Athlete';

  const last10 = await db
    .select({
      id: workouts.id,
      name: workouts.name,
      startedAt: workouts.startedAt,
      createdAt: workouts.createdAt,
      endedAt: workouts.endedAt,
      totalVolume: workouts.totalVolume,
    })
    .from(workouts)
    .where(eq(workouts.userId, userId))
    .orderBy(desc(workouts.createdAt))
    .limit(10);

  const workoutIds = last10.map((w) => w.id);
  const namesByWorkout = new Map<string, string[]>();

  if (workoutIds.length > 0) {
    const we = await db
      .select({
        workoutId: workoutExercises.workoutId,
        order: workoutExercises.order,
        exerciseName: exercises.name,
      })
      .from(workoutExercises)
      .innerJoin(exercises, eq(workoutExercises.exerciseId, exercises.id))
      .where(inArray(workoutExercises.workoutId, workoutIds))
      .orderBy(asc(workoutExercises.workoutId), asc(workoutExercises.order));

    for (const row of we) {
      const arr = namesByWorkout.get(row.workoutId) ?? [];
      arr.push(row.exerciseName);
      namesByWorkout.set(row.workoutId, arr);
    }
  }

  const last10Lines = last10.map((w) => {
    const date = (w.endedAt ?? w.startedAt ?? w.createdAt)
      .toISOString()
      .slice(0, 10);
    const vol = Number(w.totalVolume ?? 0);
    const exNames = namesByWorkout.get(w.id) ?? [];
    const exPart =
      exNames.length > 0 ? `, exercises: ${exNames.join(', ')}` : '';
    return `- ${w.name} (${date}), volume: ${vol} kg${exPart}`;
  });

  const prAgg = await db
    .select({
      exerciseId: workoutExercises.exerciseId,
      exerciseName: exercises.name,
      maxW: sql<string>`max(${workoutSets.weight}::numeric)`,
    })
    .from(workoutSets)
    .innerJoin(
      workoutExercises,
      eq(workoutSets.workoutExerciseId, workoutExercises.id),
    )
    .innerJoin(workouts, eq(workoutExercises.workoutId, workouts.id))
    .innerJoin(exercises, eq(workoutExercises.exerciseId, exercises.id))
    .where(
      and(
        eq(workouts.userId, userId),
        eq(workoutSets.completed, true),
        sql`${workoutSets.weight} is not null`,
      ),
    )
    .groupBy(workoutExercises.exerciseId, exercises.name);

  const prSorted = [...prAgg].sort(
    (a, b) => Number(b.maxW) - Number(a.maxW),
  );
  const prLines = prSorted.slice(0, 20).map(
    (r) => `- ${r.exerciseName}: ${Math.round(Number(r.maxW) * 10) / 10} kg`,
  );

  const now = new Date();
  const weekKeys: { week: string; volume: number }[] = [];
  for (let i = 0; i < 4; i += 1) {
    const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
    const weekStart = new Date(weekEnd.getTime() - 7 * 24 * 60 * 60 * 1000);
    const label = `Block ${i + 1} (${weekStart.toISOString().slice(0, 10)} → ${weekEnd.toISOString().slice(0, 10)})`;

    const [row] = await db
      .select({
        vol: sql<string>`coalesce(sum(${workouts.totalVolume}::numeric), 0)`,
      })
      .from(workouts)
      .where(
        and(
          eq(workouts.userId, userId),
          sql`coalesce(${workouts.startedAt}, ${workouts.createdAt}) >= ${weekStart}`,
          sql`coalesce(${workouts.startedAt}, ${workouts.createdAt}) < ${weekEnd}`,
        ),
      );

    weekKeys.push({
      week: label,
      volume: Number(row?.vol ?? 0),
    });
  }

  const allDays = await db
    .select({
      startedAt: workouts.startedAt,
      endedAt: workouts.endedAt,
      createdAt: workouts.createdAt,
    })
    .from(workouts)
    .where(eq(workouts.userId, userId));

  const daySet = new Set<string>();
  for (const w of allDays) {
    const d = w.endedAt ?? w.startedAt ?? w.createdAt;
    daySet.add(utcDayKey(new Date(d)));
  }
  const streak = workoutStreakFromDayKeys([...daySet]);

  const weeklyLines = weekKeys.map(
    (w) => `- ${w.week}: ${Math.round(w.volume * 10) / 10} kg total`,
  );

  return [
    `User: ${firstName}`,
    `Last 10 workouts:`,
    last10Lines.length > 0 ? last10Lines.join('\n') : '- (none yet)',
    `Personal Records:`,
    prLines.length > 0 ? prLines.join('\n') : '- (none yet)',
    `Weekly volume last 4 weeks:`,
    weeklyLines.join('\n'),
    `Current streak: ${streak} days`,
  ].join('\n');
}
