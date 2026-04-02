export type DeloadSignal =
  | 'rapid_volume_increase'   // >10% growth 3 weeks in a row
  | 'volume_drop_from_peak'   // >8% drop from recent peak
  | 'long_training_block'     // 6+ consecutive weeks without low-volume week
  | 'weight_stagnation';      // same weight 3+ sessions on a key lift

export type DeloadStatus = 'good' | 'warning' | 'recommended';

export interface WeeklyVolume {
  weekStart: string; // ISO date (Monday)
  volume: number;
}

export interface DeloadAnalysis {
  status: DeloadStatus;
  signals: DeloadSignal[];
  weeklyVolumes: WeeklyVolume[];
}

export function analyseDeloadNeed(weeklyVolumes: WeeklyVolume[]): DeloadAnalysis {
  const signals: DeloadSignal[] = [];
  const vols = weeklyVolumes.map((w) => w.volume);

  // Signal 1: rapid volume increase (>10% for 3+ consecutive weeks)
  let rapidIncreaseStreak = 0;
  for (let i = 1; i < vols.length; i++) {
    if (vols[i - 1] > 0 && (vols[i] - vols[i - 1]) / vols[i - 1] > 0.1) {
      rapidIncreaseStreak++;
    } else {
      rapidIncreaseStreak = 0;
    }
  }
  if (rapidIncreaseStreak >= 3) signals.push('rapid_volume_increase');

  // Signal 2: volume drop from peak (>8% from max in last 4 weeks)
  const recentVols = vols.slice(-4);
  const peak = Math.max(...recentVols);
  const latest = recentVols[recentVols.length - 1];
  if (peak > 0 && latest > 0 && (peak - latest) / peak > 0.08) {
    signals.push('volume_drop_from_peak');
  }

  // Signal 3: long training block (6+ weeks of non-zero volume)
  const reversed = [...vols].reverse();
  const nonZeroStreak = reversed.findIndex((v) => v === 0);
  const consecutiveWeeks = nonZeroStreak === -1 ? vols.length : nonZeroStreak;
  if (consecutiveWeeks >= 6) signals.push('long_training_block');

  // Status determination
  let status: DeloadStatus = 'good';
  if (signals.length >= 2) status = 'recommended';
  else if (signals.length === 1) status = 'warning';

  return { status, signals, weeklyVolumes };
}

/**
 * Returns the ISO date string (YYYY-MM-DD) for the Monday of the week
 * containing the given date.
 */
export function getMondayOfWeek(date: Date): string {
  const d = new Date(date);
  const day = d.getUTCDay(); // 0 = Sunday
  const diff = day === 0 ? -6 : 1 - day; // shift to Monday
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10);
}

/**
 * Build the last N week buckets (most-recent last), filling missing weeks
 * with volume = 0.
 */
export function buildWeeklyVolumes(
  rawRows: { weekStart: string; volume: number }[],
  weeks = 5,
): WeeklyVolume[] {
  const byWeek = new Map<string, number>();
  for (const row of rawRows) {
    byWeek.set(row.weekStart, row.volume);
  }

  const result: WeeklyVolume[] = [];
  const now = new Date();
  for (let i = weeks - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i * 7);
    const weekStart = getMondayOfWeek(d);
    result.push({ weekStart, volume: byWeek.get(weekStart) ?? 0 });
  }
  return result;
}
