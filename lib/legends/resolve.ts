import { searchExercisesApi } from '@/lib/api/client';
import type { Exercise } from '@/lib/types';

/**
 * Resolve legend exercise names to DB exercises (for preset → workout copy).
 * For each name, searches and uses the first match; skips names with no match.
 */
export async function resolveLegendExercises(
  names: string[],
): Promise<Exercise[]> {
  const out: Exercise[] = [];
  for (const name of names) {
    const list = await searchExercisesApi(name.trim(), undefined, 5);
    const match =
      list.find(
        (e) => e.name.toLowerCase() === name.toLowerCase().trim(),
      ) ?? list[0];
    if (match) out.push(match);
  }
  return out;
}
