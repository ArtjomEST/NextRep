/**
 * Workout session score (0–100) from volume, intensity, consistency, duration, PR bonus.
 */

export interface WorkoutScoreBreakdown {
  total: number;
  volume: number;
  intensity: number;
  consistency: number;
  duration: number;
  prBonus: number;
}

export interface WorkoutScoreInput {
  /** This session total volume (kg). */
  currentWorkoutVolume: number;
  /** Mean volume per session over workouts in the last 4 weeks (excluding this workout). */
  avgWorkoutVolumeLast4Weeks: number;
  /** Average weight (kg) per completed set with weight > 0 in this workout. */
  currentAvgWeightPerSet: number;
  /** Highest session average weight-per-set seen in any prior workout (same definition). */
  bestEverAvgWeightPerSet: number;
  completedSets: number;
  plannedSets: number;
  durationMinutes: number;
  hasPersonalRecord: boolean;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function roundScore(n: number): number {
  return Math.round(clamp(n, 0, 100));
}

/** Volume (30 pts): compare session volume vs avg session volume last 4 weeks. */
function scoreVolume(current: number, avg: number): number {
  if (avg <= 0) return current > 0 ? 30 : 0;
  if (current >= avg) return 30;
  return roundScore((current / avg) * 30);
}

/**
 * Intensity (25 pts): session avg weight/set vs best-ever session avg weight/set.
 * All-time best session → 25 pts; otherwise scaled proportionally.
 */
function scoreIntensity(current: number, bestEver: number): number {
  if (bestEver <= 0) return current > 0 ? 25 : 0;
  if (current >= bestEver) return 25;
  return roundScore((current / bestEver) * 25);
}

/** Consistency (20 pts): completed / planned sets × 20. */
function scoreConsistency(completed: number, planned: number): number {
  if (planned <= 0) return 0;
  return roundScore((completed / planned) * 20);
}

/**
 * Duration (15 pts): optimal 45–75 min → 15 pts.
 * &lt; 30 or &gt; 120 min → 0; linear ramps in between.
 */
function scoreDuration(minutes: number): number {
  const m = minutes;
  if (m <= 0) return 0;
  if (m < 30) return 0;
  if (m > 120) return 0;
  if (m >= 45 && m <= 75) return 15;
  if (m >= 30 && m < 45) return roundScore(((m - 30) / 15) * 15);
  // 75 < m <= 120
  return roundScore(((120 - m) / 45) * 15);
}

export function computeWorkoutScore(input: WorkoutScoreInput): WorkoutScoreBreakdown {
  const volume = scoreVolume(
    input.currentWorkoutVolume,
    input.avgWorkoutVolumeLast4Weeks,
  );
  const intensity = scoreIntensity(
    input.currentAvgWeightPerSet,
    input.bestEverAvgWeightPerSet,
  );
  const consistency = scoreConsistency(
    input.completedSets,
    input.plannedSets,
  );
  const duration = scoreDuration(input.durationMinutes);
  const prBonus = input.hasPersonalRecord ? 10 : 0;

  const raw = volume + intensity + consistency + duration + prBonus;
  const total = Math.min(100, raw);

  return {
    total,
    volume,
    intensity,
    consistency,
    duration,
    prBonus,
  };
}
