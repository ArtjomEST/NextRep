import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import {
  workouts,
  workoutExercises,
  workoutSets,
  exercises,
} from '@/lib/db/schema';
import { eq, asc, and } from 'drizzle-orm';
import { authenticateRequest } from '@/lib/auth/helpers';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const db = getDb();
    const auth = await authenticateRequest(req);
    if (!auth) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 },
      );
    }

    const { id: exerciseId } = await params;

    const [exercise] = await db
      .select({
        id: exercises.id,
        name: exercises.name,
        category: exercises.category,
        measurementType: exercises.measurementType,
      })
      .from(exercises)
      .where(eq(exercises.id, exerciseId))
      .limit(1);

    if (!exercise) {
      return NextResponse.json(
        { error: 'Exercise not found' },
        { status: 404 },
      );
    }

    const weRows = await db
      .select({
        weId: workoutExercises.id,
        workoutId: workoutExercises.workoutId,
        workoutCreatedAt: workouts.createdAt,
      })
      .from(workoutExercises)
      .innerJoin(workouts, eq(workoutExercises.workoutId, workouts.id))
      .where(
        and(
          eq(workoutExercises.exerciseId, exerciseId),
          eq(workouts.userId, auth.userId),
        ),
      )
      .orderBy(asc(workouts.createdAt));

    if (weRows.length === 0) {
      return NextResponse.json({
        data: {
          measurementType: exercise.measurementType,
          pr: null,
          last5: [],
          progress30d: null,
        },
      });
    }

    const allSets: {
      weId: string;
      workoutId: string;
      workoutCreatedAt: Date;
      setIndex: number;
      weight: number | null;
      reps: number | null;
      seconds: number | null;
      completed: boolean;
    }[] = [];

    for (const we of weRows) {
      const sets = await db
        .select()
        .from(workoutSets)
        .where(eq(workoutSets.workoutExerciseId, we.weId))
        .orderBy(asc(workoutSets.setIndex));
      for (const s of sets) {
        allSets.push({
          weId: we.weId,
          workoutId: we.workoutId,
          workoutCreatedAt: we.workoutCreatedAt,
          setIndex: s.setIndex,
          weight: s.weight != null ? Number(s.weight) : null,
          reps: s.reps,
          seconds: s.seconds,
          completed: s.completed,
        });
      }
    }

    const mt = exercise.measurementType;
    const completedSets = allSets.filter((s) => s.completed);

    let pr: {
      bestWeight?: number;
      bestReps?: number;
      bestVolume?: number;
      bestSeconds?: number;
      date: string;
    } | null = null;

    if (completedSets.length > 0) {
      if (mt === 'weight_reps') {
        const withVolume = completedSets
          .filter((s) => s.weight != null && s.reps != null)
          .map((s) => ({
            ...s,
            volume: s.weight! * s.reps!,
          }));
        const bestByWeight = [...withVolume].sort(
          (a, b) => (b.weight ?? 0) - (a.weight ?? 0),
        )[0];
        const bestByVolume = [...withVolume].sort(
          (a, b) => b.volume - a.volume,
        )[0];
        if (bestByWeight) {
          const workoutRow = weRows.find((w) => w.weId === bestByWeight.weId);
          pr = {
            bestWeight: bestByWeight.weight!,
            bestReps: bestByWeight.reps!,
            bestVolume: bestByVolume?.volume,
            date: workoutRow?.workoutCreatedAt.toISOString() ?? '',
          };
        }
      } else if (mt === 'reps_only') {
        const best = [...completedSets]
          .filter((s) => s.reps != null)
          .sort((a, b) => (b.reps ?? 0) - (a.reps ?? 0))[0];
        if (best) {
          const workoutRow = weRows.find((w) => w.weId === best.weId);
          pr = {
            bestReps: best.reps!,
            date: workoutRow?.workoutCreatedAt.toISOString() ?? '',
          };
        }
      } else if (mt === 'time') {
        const best = [...completedSets]
          .filter((s) => s.seconds != null)
          .sort((a, b) => (b.seconds ?? 0) - (a.seconds ?? 0))[0];
        if (best) {
          const workoutRow = weRows.find((w) => w.weId === best.weId);
          pr = {
            bestSeconds: best.seconds!,
            date: workoutRow?.workoutCreatedAt.toISOString() ?? '',
          };
        }
      }
    }

    const byWorkout = new Map<
      string,
      {
        workoutId: string;
        date: string;
        sets: typeof allSets;
      }
    >();
    for (const s of allSets) {
      const existing = byWorkout.get(s.workoutId);
      if (!existing) {
        byWorkout.set(s.workoutId, {
          workoutId: s.workoutId,
          date: s.workoutCreatedAt.toISOString(),
          sets: [s],
        });
      } else {
        existing.sets.push(s);
      }
    }

    const sortedWorkouts = [...byWorkout.values()].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
    const last5 = sortedWorkouts.slice(0, 5).map((w) => {
      const completed = w.sets.filter((s) => s.completed);
      let bestWeight: number | null = null;
      let bestReps: number | null = null;
      let bestSeconds: number | null = null;
      let volume = 0;
      if (mt === 'weight_reps') {
        const withVol = completed.filter(
          (s) => s.weight != null && s.reps != null,
        );
        for (const s of withVol) {
          volume += s.weight! * s.reps!;
        }
        const best = [...withVol].sort(
          (a, b) => (b.weight ?? 0) - (a.weight ?? 0),
        )[0];
        if (best) {
          bestWeight = best.weight!;
          bestReps = best.reps!;
        }
      } else if (mt === 'reps_only') {
        const best = [...completed].filter((s) => s.reps != null).sort(
          (a, b) => (b.reps ?? 0) - (a.reps ?? 0),
        )[0];
        if (best) bestReps = best.reps!;
      } else if (mt === 'time') {
        const best = [...completed].filter((s) => s.seconds != null).sort(
          (a, b) => (b.seconds ?? 0) - (a.seconds ?? 0),
        )[0];
        if (best) bestSeconds = best.seconds!;
      }
      return {
        workoutId: w.workoutId,
        date: w.date,
        bestWeight,
        bestReps,
        bestSeconds,
        volume,
      };
    });

    const now = Date.now();
    const last30Start = now - THIRTY_DAYS_MS;
    const prev30Start = last30Start - THIRTY_DAYS_MS;

    let progress30d: {
      deltaWeight?: number;
      deltaReps?: number;
      deltaVolume?: number;
      deltaSeconds?: number;
      deltaPercent?: number;
      label: string;
    } | null = null;

    if (mt === 'weight_reps' && sortedWorkouts.length >= 2) {
      const inLast30 = sortedWorkouts.filter(
        (w) =>
          new Date(w.date).getTime() >= last30Start &&
          new Date(w.date).getTime() <= now,
      );
      const inPrev30 = sortedWorkouts.filter(
        (w) =>
          new Date(w.date).getTime() >= prev30Start &&
          new Date(w.date).getTime() < last30Start,
      );

      const getBestWeight = (list: typeof sortedWorkouts) => {
        let best = 0;
        for (const w of list) {
          for (const s of w.sets.filter((s) => s.completed && s.weight != null)) {
            if (s.weight! > best) best = s.weight!;
          }
        }
        return best;
      };
      const getBestVolume = (list: typeof sortedWorkouts) => {
        let best = 0;
        for (const w of list) {
          for (const s of w.sets.filter(
            (s) => s.completed && s.weight != null && s.reps != null,
          )) {
            const v = s.weight! * s.reps!;
            if (v > best) best = v;
          }
        }
        return best;
      };

      const bestWeightLast30 = getBestWeight(inLast30);
      const bestWeightPrev30 = getBestWeight(inPrev30);
      const bestVolLast30 = getBestVolume(inLast30);
      const bestVolPrev30 = getBestVolume(inPrev30);

      if (bestWeightPrev30 > 0 || bestWeightLast30 > 0) {
        const deltaWeight = bestWeightLast30 - bestWeightPrev30;
        const deltaVolume =
          bestVolPrev30 > 0
            ? (bestVolLast30 - bestVolPrev30) / bestVolPrev30
            : 0;
        progress30d = {
          deltaWeight,
          deltaVolume: deltaVolume > 0 ? 100 * deltaVolume : 0,
          label: 'last 30 days',
        };
      } else if (sortedWorkouts.length >= 2) {
        const recent = sortedWorkouts[0];
        const oldest = sortedWorkouts[sortedWorkouts.length - 1];
        const getBest = (w: (typeof sortedWorkouts)[0]) => {
          let best = 0;
          for (const s of w.sets.filter((s) => s.completed && s.weight != null)) {
            if (s.weight! > best) best = s.weight!;
          }
          return best;
        };
        const bestRecent = getBest(recent);
        const bestOldest = getBest(oldest);
        progress30d = {
          deltaWeight: bestRecent - bestOldest,
          label: 'last 5 sessions',
        };
      }
    } else if (mt === 'reps_only' && sortedWorkouts.length >= 2) {
      const recent = sortedWorkouts[0];
      const oldest = sortedWorkouts[sortedWorkouts.length - 1];
      const getBest = (w: (typeof sortedWorkouts)[0]) => {
        let best = 0;
        for (const s of w.sets.filter((s) => s.completed && s.reps != null)) {
          if (s.reps! > best) best = s.reps!;
        }
        return best;
      };
      progress30d = {
        deltaReps: getBest(recent) - getBest(oldest),
        label: 'last 5 sessions',
      };
    } else if (mt === 'time' && sortedWorkouts.length >= 2) {
      const recent = sortedWorkouts[0];
      const oldest = sortedWorkouts[sortedWorkouts.length - 1];
      const getBest = (w: (typeof sortedWorkouts)[0]) => {
        let best = 0;
        for (const s of w.sets.filter((s) => s.completed && s.seconds != null)) {
          if (s.seconds! > best) best = s.seconds!;
        }
        return best;
      };
      progress30d = {
        deltaSeconds: getBest(recent) - getBest(oldest),
        label: 'last 5 sessions',
      };
    }

    return NextResponse.json({
      data: {
        measurementType: exercise.measurementType,
        pr,
        last5,
        progress30d,
      },
    });
  } catch (err) {
    console.error('GET /api/progress/exercises/[id] error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch progress', message: String(err) },
      { status: 500 },
    );
  }
}
