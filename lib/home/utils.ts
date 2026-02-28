import type { WorkoutListItem, WorkoutDetail, WorkoutDetailExercise, WorkoutDetailSet } from '@/lib/api/types';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DAYS_SINCE_LAST_RECENT = 3;
const PR_LOOKBACK_DAYS = 7;
const WEEK_SESSION_TARGET = 4;

/** Get workout date (start of day UTC) from list item. */
function getWorkoutDate(item: WorkoutListItem): string {
  const iso = item.startedAt ?? item.createdAt;
  return iso ? iso.slice(0, 10) : '';
}

/** Subtitle message based on workout history. */
export function getSubtitleMessage(
  workoutCount: number,
  lastWorkoutDate: string | null,
): string {
  if (workoutCount === 0) return 'Start your journey today';
  if (!lastWorkoutDate) return "Let's crush it today";

  const last = new Date(lastWorkoutDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  last.setHours(0, 0, 0, 0);
  const daysSince = Math.floor((today.getTime() - last.getTime()) / MS_PER_DAY);

  if (daysSince === 0) return "Let's crush it today";
  if (daysSince === 1) return 'Keep the momentum going';
  if (daysSince > DAYS_SINCE_LAST_RECENT) return "Let's get back on track";
  return "Let's crush it today";
}

/** Map category to focus type. */
const PUSH_CATEGORIES = new Set(['chest', 'shoulders', 'triceps', 'arms']);
const PULL_CATEGORIES = new Set(['back', 'biceps']);
const LEG_CATEGORIES = new Set(['legs', 'calves', 'quadriceps', 'hamstrings', 'glutes']);

function getCategoriesFromDetail(detail: WorkoutDetail): Set<string> {
  const cats = new Set<string>();
  for (const ex of detail.exercises) {
    const c = (ex.category ?? '').toLowerCase();
    if (c) cats.add(c);
  }
  return cats;
}

function isPushHeavy(cats: Set<string>): boolean {
  return [...cats].some((c) => PUSH_CATEGORIES.has(c) || c.includes('chest') || c.includes('shoulder'));
}

function isPullHeavy(cats: Set<string>): boolean {
  return [...cats].some((c) => PULL_CATEGORIES.has(c) || c.includes('back') || c.includes('bicep'));
}

function isLegHeavy(cats: Set<string>): boolean {
  return [...cats].some((c) => LEG_CATEGORIES.has(c) || c.includes('leg') || c.includes('calf'));
}

export interface TodayFocus {
  name: string;
  subline: string;
  suggestedCategory: string | null;
}

/** Suggest today's focus from latest workout detail (or null if no history). */
export function getTodayFocus(
  workoutCount: number,
  lastWorkoutDetail: WorkoutDetail | null,
  daysSinceLastWorkout: number,
): TodayFocus {
  if (workoutCount === 0) {
    return {
      name: 'Full Body',
      subline: 'Build your base',
      suggestedCategory: null,
    };
  }

  if (daysSinceLastWorkout > DAYS_SINCE_LAST_RECENT) {
    return {
      name: 'Full Body',
      subline: 'Get back on track',
      suggestedCategory: null,
    };
  }

  if (!lastWorkoutDetail) {
    return {
      name: 'Full Body',
      subline: 'Build your base',
      suggestedCategory: null,
    };
  }

  const cats = getCategoriesFromDetail(lastWorkoutDetail);
  if (isPushHeavy(cats)) {
    return {
      name: 'Pull Day',
      subline: 'Back · Biceps',
      suggestedCategory: 'Back',
    };
  }
  if (isPullHeavy(cats)) {
    return {
      name: 'Leg Day',
      subline: 'Legs · Calves',
      suggestedCategory: 'Legs',
    };
  }
  if (isLegHeavy(cats)) {
    return {
      name: 'Push Day',
      subline: 'Chest · Shoulders · Triceps',
      suggestedCategory: 'Chest',
    };
  }

  return {
    name: 'Full Body',
    subline: 'Balanced session',
    suggestedCategory: null,
  };
}

/** Consecutive days with at least one workout (from today backwards). */
export function computeStreak(items: WorkoutListItem[]): number {
  const dates = new Set<string>();
  for (const w of items) {
    const d = getWorkoutDate(w);
    if (d) dates.add(d);
  }
  if (dates.size === 0) return 0;

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    if (dates.has(key)) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

/** Workouts this week (Mon–Sun) and count. */
export function getThisWeekCount(items: WorkoutListItem[]): number {
  const now = new Date();
  const day = now.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);
  const nextMonday = new Date(monday);
  nextMonday.setDate(monday.getDate() + 7);

  let count = 0;
  for (const w of items) {
    const iso = w.startedAt ?? w.createdAt;
    if (!iso) continue;
    const d = new Date(iso);
    if (d >= monday && d < nextMonday) count++;
  }
  return count;
}

/** Which weekdays (0–6) have a workout in the last 7 days. */
export function getWeekDotDates(items: WorkoutListItem[]): number[] {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * MS_PER_DAY);
  const days: number[] = [];
  for (const w of items) {
    const iso = w.startedAt ?? w.createdAt;
    if (!iso) continue;
    const d = new Date(iso);
    if (d >= weekAgo) days.push(d.getDay());
  }
  return [...new Set(days)];
}

/** This month and last month stats from list. */
export function getMonthSnapshot(items: WorkoutListItem[]): {
  thisMonthWorkouts: number;
  thisMonthVolume: number;
  lastMonthWorkouts: number;
  lastMonthVolume: number;
  volumeDelta: number | null;
  workoutsDelta: number | null;
} {
  const now = new Date();
  const thisYear = now.getFullYear();
  const thisMonth = now.getMonth();
  const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
  const lastYear = thisMonth === 0 ? thisYear - 1 : thisYear;

  let thisMonthWorkouts = 0;
  let thisMonthVolume = 0;
  let lastMonthWorkouts = 0;
  let lastMonthVolume = 0;

  for (const w of items) {
    const iso = w.startedAt ?? w.createdAt;
    if (!iso) continue;
    const d = new Date(iso);
    const y = d.getFullYear();
    const m = d.getMonth();
    if (y === thisYear && m === thisMonth) {
      thisMonthWorkouts++;
      thisMonthVolume += w.totalVolume ?? 0;
    } else if (y === lastYear && m === lastMonth) {
      lastMonthWorkouts++;
      lastMonthVolume += w.totalVolume ?? 0;
    }
  }

  let volumeDelta: number | null = null;
  let workoutsDelta: number | null = null;
  if (lastMonthWorkouts > 0 || lastMonthVolume > 0) {
    volumeDelta = thisMonthVolume - lastMonthVolume;
    workoutsDelta = thisMonthWorkouts - lastMonthWorkouts;
  }

  return {
    thisMonthWorkouts,
    thisMonthVolume,
    lastMonthWorkouts,
    lastMonthVolume,
    volumeDelta,
    workoutsDelta,
  };
}

/** Best value for one exercise in a workout (for PR). */
function exerciseBestInWorkout(
  ex: WorkoutDetailExercise,
  sets: WorkoutDetailSet[],
): { value: number; weight?: number; reps?: number; seconds?: number; exerciseName: string; measurementType: string } | null {
  const completed = sets.filter((s) => s.completed);
  if (completed.length === 0) return null;

  const mt = (ex.measurementType ?? 'weight_reps').toLowerCase();
  if (mt === 'time' || mt === 'seconds') {
    const best = Math.max(...completed.map((s) => s.seconds ?? 0));
    if (best <= 0) return null;
    return { value: best, seconds: best, exerciseName: ex.exerciseName, measurementType: 'time' };
  }
  if (mt === 'reps_only') {
    const best = Math.max(...completed.map((s) => s.reps ?? 0));
    if (best <= 0) return null;
    return { value: best, reps: best, exerciseName: ex.exerciseName, measurementType: 'reps_only' };
  }
  const bestWeight = Math.max(...completed.map((s) => s.weight ?? 0));
  let bestVolume = 0;
  for (const s of completed) {
    const w = s.weight ?? 0;
    const r = s.reps ?? 0;
    if (w * r > bestVolume) bestVolume = w * r;
  }
  if (bestVolume <= 0 && bestWeight <= 0) return null;
  return {
    value: bestVolume || bestWeight,
    weight: bestWeight,
    reps: Math.max(...completed.map((s) => s.reps ?? 0)),
    exerciseName: ex.exerciseName,
    measurementType: 'weight_reps',
  };
}

function bestPerExerciseInDetail(
  detail: WorkoutDetail,
): Map<string, { value: number; weight?: number; reps?: number; seconds?: number; exerciseName: string; measurementType: string }> {
  const map = new Map();
  for (const ex of detail.exercises) {
    const b = exerciseBestInWorkout(ex, ex.sets);
    if (b) map.set(ex.exerciseId, b);
  }
  return map;
}

export interface PRAlert {
  exerciseName: string;
  label: string;
}

/** Find a PR in the latest workout vs the previous one. Returns first PR found with delta label. */
export function findRecentPR(
  latestDetail: WorkoutDetail | null,
  previousDetail: WorkoutDetail | null,
): PRAlert | null {
  if (!latestDetail || latestDetail.exercises.length === 0) return null;

  const latestBest = bestPerExerciseInDetail(latestDetail);
  const previousBest = previousDetail ? bestPerExerciseInDetail(previousDetail) : new Map();

  for (const [exerciseId, current] of latestBest) {
    const prev = previousBest.get(exerciseId);
    if (!prev) continue;
    if (current.value <= prev.value) continue;

    let label: string;
    if (current.measurementType === 'time' && current.seconds != null && prev.seconds != null) {
      const delta = current.seconds - prev.seconds;
      label = `+${delta} sec vs previous best`;
    } else if (current.measurementType === 'reps_only' && current.reps != null && prev.reps != null) {
      const delta = current.reps - prev.reps;
      label = `+${delta} reps vs previous best`;
    } else if (current.measurementType === 'weight_reps' && current.weight != null && prev.weight != null) {
      const delta = current.weight - prev.weight;
      label = `+${delta} kg vs previous best`;
    } else {
      label = 'New personal record';
    }
    return { exerciseName: current.exerciseName, label };
  }
  return null;
}

/** Check if latest workout is within last 7 days (for PR card). */
export function isLatestWorkoutWithinDays(
  latestItem: WorkoutListItem | null,
  days: number,
): boolean {
  if (!latestItem) return false;
  const iso = latestItem.startedAt ?? latestItem.createdAt;
  if (!iso) return false;
  const d = new Date(iso);
  const now = new Date();
  return (now.getTime() - d.getTime()) <= days * MS_PER_DAY;
}

export { WEEK_SESSION_TARGET };
