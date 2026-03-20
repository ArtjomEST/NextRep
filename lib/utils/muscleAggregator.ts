export type ExerciseMuscleInput = {
  primaryMuscles: string[];
  secondaryMuscles: string[];
};

/**
 * Primary = muscles that appear in primary_muscles of any exercise.
 * Secondary = muscles that appear in secondary_muscles but never as primary.
 * Both arrays are deduplicated.
 */
export function aggregateMusclesFromExercises(
  exercises: ExerciseMuscleInput[],
): { primaryMuscles: string[]; secondaryMuscles: string[] } {
  const primarySet = new Set<string>();
  for (const ex of exercises) {
    for (const m of ex.primaryMuscles ?? []) {
      if (m) primarySet.add(m);
    }
  }
  const secondarySet = new Set<string>();
  for (const ex of exercises) {
    for (const m of ex.secondaryMuscles ?? []) {
      if (m && !primarySet.has(m)) secondarySet.add(m);
    }
  }
  return {
    primaryMuscles: [...primarySet],
    secondaryMuscles: [...secondarySet],
  };
}
