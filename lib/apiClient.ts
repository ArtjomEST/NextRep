import type { Workout, Exercise, WorkoutDraft } from './types';
import { mockExercises, mockWorkouts } from './mockData';

/**
 * Placeholder API client — every function resolves locally.
 * When the backend is ready, replace the bodies with real fetch() calls.
 * The signatures and return types should stay the same.
 */

export async function fetchWorkouts(): Promise<Workout[]> {
  return Promise.resolve([...mockWorkouts]);
}

export async function saveWorkout(workout: Workout): Promise<Workout> {
  return Promise.resolve(workout);
}

export async function searchExercises(query: string): Promise<Exercise[]> {
  const q = query.toLowerCase();
  return Promise.resolve(
    mockExercises.filter((e) => e.name.toLowerCase().includes(q)),
  );
}

export async function fetchExercises(): Promise<Exercise[]> {
  return Promise.resolve([...mockExercises]);
}

export async function saveDraft(_draft: WorkoutDraft): Promise<void> {
  return Promise.resolve();
}

export async function deleteDraft(): Promise<void> {
  return Promise.resolve();
}
