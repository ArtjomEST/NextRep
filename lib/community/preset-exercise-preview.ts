import { inArray } from 'drizzle-orm';
import type { Database } from '@/lib/db';
import { exercises } from '@/lib/db/schema';
import type { FeedPresetExercisePreview } from '@/lib/api/types';

function muscleGroupLabel(primary: string[], secondary: string[]): string | null {
  const p = primary[0];
  if (p) return p;
  const s = secondary[0];
  return s ?? null;
}

function normalizeImageUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string') return null;
  const t = url.trim();
  return t.length > 0 ? t : null;
}

type ExerciseRowMeta = {
  id: string;
  name: string;
  imageUrl: string | null;
  primaryMuscles: string[];
  secondaryMuscles: string[];
};

/** Build previews from a map (e.g. batched feed query). Order follows `orderedIds`. */
export function buildPresetExercisePreviewsFromRows(
  orderedIds: string[],
  rowById: Map<string, ExerciseRowMeta>,
): FeedPresetExercisePreview[] {
  const out: FeedPresetExercisePreview[] = [];
  for (const id of orderedIds) {
    const ex = rowById.get(id);
    if (!ex) continue;
    out.push({
      exerciseId: ex.id,
      name: ex.name,
      imageUrl: normalizeImageUrl(ex.imageUrl),
      muscleGroup: muscleGroupLabel(ex.primaryMuscles, ex.secondaryMuscles),
      setsRepsLabel: null,
      setsWeightLabel: null,
      targetSets: null,
    });
  }
  return out;
}

/**
 * Loads exercise rows and returns previews in the same order as `orderedIds`.
 */
export async function fetchPresetExercisePreviewsByIds(
  db: Database,
  orderedIds: string[],
): Promise<FeedPresetExercisePreview[]> {
  const ids = orderedIds.filter((x): x is string => typeof x === 'string' && x.length > 0);
  if (ids.length === 0) return [];

  const rows = await db
    .select({
      id: exercises.id,
      name: exercises.name,
      imageUrl: exercises.imageUrl,
      primaryMuscles: exercises.primaryMuscles,
      secondaryMuscles: exercises.secondaryMuscles,
    })
    .from(exercises)
    .where(inArray(exercises.id, ids));

  const byId = new Map<string, ExerciseRowMeta>(
    rows.map((e) => [
      e.id,
      {
        id: e.id,
        name: e.name,
        imageUrl: normalizeImageUrl(e.imageUrl),
        primaryMuscles: Array.isArray(e.primaryMuscles) ? e.primaryMuscles : [],
        secondaryMuscles: Array.isArray(e.secondaryMuscles) ? e.secondaryMuscles : [],
      },
    ]),
  );

  return buildPresetExercisePreviewsFromRows(ids, byId);
}
