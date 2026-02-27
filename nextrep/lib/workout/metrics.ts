import type { WorkoutDraft, WorkoutExercise, WorkoutSet } from '@/lib/types';

export function computeTotalVolume(exercises: WorkoutExercise[]): number {
  return exercises.reduce((total, ex) => {
    return total + ex.sets
      .filter((s) => s.completed)
      .reduce((sum, s) => sum + s.weight * s.reps, 0);
  }, 0);
}

export function computeTotalSets(exercises: WorkoutExercise[]): number {
  return exercises.reduce((total, ex) => {
    return total + ex.sets.filter((s) => s.completed).length;
  }, 0);
}

export function computeTotalExercises(exercises: WorkoutExercise[]): number {
  return exercises.filter((ex) => ex.sets.some((s) => s.completed)).length;
}

export function computeDuration(startedAt: string | null, endedAt: string | null): number {
  if (!startedAt) return 0;
  const end = endedAt ? new Date(endedAt) : new Date();
  const start = new Date(startedAt);
  return Math.floor((end.getTime() - start.getTime()) / 1000 / 60);
}

export function computePRsPlaceholder(exercises: WorkoutExercise[]): number {
  let count = 0;
  for (const ex of exercises) {
    const maxWeight = Math.max(...ex.sets.filter((s) => s.completed).map((s) => s.weight), 0);
    if (maxWeight > 0) count++;
  }
  return Math.min(count, 2);
}

export function computeImprovementMock(_draft: WorkoutDraft): number {
  return +(Math.random() * 8 - 2).toFixed(1);
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function defaultWorkoutName(): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return `Workout — ${days[new Date().getDay()]}`;
}

export function createEmptySet(): WorkoutSet {
  return {
    id: generateId(),
    weight: 0,
    reps: 0,
    completed: false,
    createdAt: new Date().toISOString(),
  };
}

export function createPrefilledSet(exercise: WorkoutExercise): WorkoutSet {
  const existingSets = exercise.sets;
  if (existingSets.length > 0) {
    const last = existingSets[existingSets.length - 1];
    return {
      id: generateId(),
      weight: last.weight,
      reps: last.reps,
      completed: false,
      createdAt: new Date().toISOString(),
    };
  }
  return createEmptySet();
}

export function getNextPendingExerciseId(
  exercises: WorkoutExercise[],
  afterId: string | null,
): string | null {
  if (exercises.length === 0) return null;
  const afterIndex = afterId ? exercises.findIndex((e) => e.id === afterId) : -1;
  for (let i = afterIndex + 1; i < exercises.length; i++) {
    if (exercises[i].status === 'pending') return exercises[i].id;
  }
  for (let i = 0; i < afterIndex; i++) {
    if (exercises[i].status === 'pending') return exercises[i].id;
  }
  return null;
}
