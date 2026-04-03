/**
 * Muscle balance analysis for weekly fitness report.
 * Classifies each muscle group as overworked / normal / untrained
 * based on how many workouts this week targeted it as a primary muscle.
 */

// Maps exercise muscle names (from DB) to react-body-highlighter slugs
const MUSCLE_NAME_TO_SLUG: Record<string, string> = {
  Chest: 'chest',
  Biceps: 'biceps',
  Brachialis: 'biceps',
  Triceps: 'triceps',
  'Triceps Brachii': 'triceps',
  Lats: 'upper-back',
  Shoulders: 'front-deltoids',
  'Deltoid Anterior': 'front-deltoids',
  'Deltoid Posterior': 'back-deltoids',
  Quads: 'quadriceps',
  Hamstrings: 'hamstring',
  Glutes: 'gluteal',
  Calves: 'calves',
  Abs: 'abs',
  Trapezius: 'trapezius',
  Forearms: 'forearm',
  Obliques: 'obliques',
  'Lower Back': 'lower-back',
  Adductors: 'adductor',
  Abductors: 'abductors',
  'Pectoralis Major': 'chest',
  'Latissimus Dorsi': 'upper-back',
};

export type MuscleStatus = 'overworked' | 'normal' | 'untrained';

// Push slugs (anterior chain)
const PUSH_SLUGS = new Set(['chest', 'front-deltoids', 'triceps']);
// Pull slugs (posterior chain)
const PULL_SLUGS = new Set(['upper-back', 'biceps', 'back-deltoids']);

export interface WorkoutRow {
  workoutId: string;
  primaryMuscles: string[] | null;
}

export interface MuscleAnalysisResult {
  muscleStatuses: Record<string, MuscleStatus>;
  pushWorkouts: number;
  pullWorkouts: number;
  pushPullLabel: string; // 'balanced' | 'push-heavy' | 'pull-heavy'
  overworkedMuscles: string[];  // human-readable names
  underworkedMuscles: string[]; // human-readable names
  normalMuscles: string[];
}

function slugToName(slug: string): string {
  const map: Record<string, string> = {
    chest: 'Chest',
    biceps: 'Biceps',
    triceps: 'Triceps',
    'upper-back': 'Back',
    'lower-back': 'Lower Back',
    'front-deltoids': 'Front Delts',
    'back-deltoids': 'Rear Delts',
    quadriceps: 'Quads',
    hamstring: 'Hamstrings',
    gluteal: 'Glutes',
    calves: 'Calves',
    abs: 'Abs',
    trapezius: 'Traps',
    forearm: 'Forearms',
    obliques: 'Obliques',
    adductor: 'Adductors',
    abductors: 'Abductors',
  };
  return map[slug] ?? slug;
}

/**
 * Deduped by workoutId — each workout counts once per muscle slug it targeted.
 * Thresholds: 0 → untrained, 1-2 → normal, 3+ → overworked
 */
export function analyzeMuscleBalance(workouts: WorkoutRow[]): MuscleAnalysisResult {
  // Map: slug → Set of workoutIds that targeted it as primary
  const muscleWorkoutSets: Record<string, Set<string>> = {};

  for (const row of workouts) {
    if (!row.primaryMuscles) continue;
    for (const muscleName of row.primaryMuscles) {
      const slug = MUSCLE_NAME_TO_SLUG[muscleName];
      if (!slug) continue;
      if (!muscleWorkoutSets[slug]) muscleWorkoutSets[slug] = new Set();
      muscleWorkoutSets[slug].add(row.workoutId);
    }
  }

  // Classify each known slug
  const muscleStatuses: Record<string, MuscleStatus> = {};
  const allHighlightedSlugs = Object.values(MUSCLE_NAME_TO_SLUG);
  const uniqueSlugs = [...new Set(allHighlightedSlugs)].filter(
    (s) => !['head', 'neck', 'knees', 'left-soleus', 'right-soleus'].includes(s),
  );

  for (const slug of uniqueSlugs) {
    const count = muscleWorkoutSets[slug]?.size ?? 0;
    if (count === 0) muscleStatuses[slug] = 'untrained';
    else if (count <= 2) muscleStatuses[slug] = 'normal';
    else muscleStatuses[slug] = 'overworked';
  }

  // Push / pull balance
  let pushWorkouts = 0;
  let pullWorkouts = 0;
  for (const [slug, workoutSet] of Object.entries(muscleWorkoutSets)) {
    if (PUSH_SLUGS.has(slug)) pushWorkouts = Math.max(pushWorkouts, workoutSet.size);
    if (PULL_SLUGS.has(slug)) pullWorkouts = Math.max(pullWorkouts, workoutSet.size);
  }

  let pushPullLabel: string;
  if (pushWorkouts === 0 && pullWorkouts === 0) pushPullLabel = 'balanced';
  else if (pushWorkouts > pullWorkouts + 1) pushPullLabel = 'push-heavy';
  else if (pullWorkouts > pushWorkouts + 1) pushPullLabel = 'pull-heavy';
  else pushPullLabel = 'balanced';

  // Human-readable lists for report text
  const overworkedMuscles = Object.entries(muscleStatuses)
    .filter(([, s]) => s === 'overworked')
    .map(([slug]) => slugToName(slug));
  const underworkedMuscles = Object.entries(muscleStatuses)
    .filter(([, s]) => s === 'untrained')
    .map(([slug]) => slugToName(slug));
  const normalMuscles = Object.entries(muscleStatuses)
    .filter(([, s]) => s === 'normal')
    .map(([slug]) => slugToName(slug));

  return {
    muscleStatuses,
    pushWorkouts,
    pullWorkouts,
    pushPullLabel,
    overworkedMuscles,
    underworkedMuscles,
    normalMuscles,
  };
}
