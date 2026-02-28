// ─── Save Workout Request / Response ────────────────────────

export interface SaveWorkoutSetPayload {
  setIndex: number;
  completed: boolean;
  weight: number | null;
  reps: number | null;
  seconds: number | null;
}

export interface SaveWorkoutExercisePayload {
  exerciseId: string;
  exerciseName?: string;
  order: number;
  status: 'pending' | 'completed';
  sets: SaveWorkoutSetPayload[];
}

export interface SaveWorkoutRequest {
  name: string;
  startedAt?: string;
  endedAt?: string;
  durationSec?: number;
  notes?: string;
  exercises: SaveWorkoutExercisePayload[];
}

export interface SaveWorkoutResponse {
  workoutId: string;
  createdAt: string;
  totalVolume: number;
  totalSets: number;
  durationSec: number | null;
}

// ─── Workout List Item (GET /api/workouts) ──────────────────

export interface WorkoutListItem {
  id: string;
  name: string;
  createdAt: string;
  startedAt: string | null;
  endedAt: string | null;
  totalVolume: number;
  totalSets: number;
  durationSec: number | null;
  exerciseCount: number;
}

// ─── Workout Detail (GET /api/workouts/[id]) ────────────────

export interface WorkoutDetailSet {
  id: string;
  setIndex: number;
  weight: number | null;
  reps: number | null;
  seconds: number | null;
  completed: boolean;
}

export interface WorkoutDetailExercise {
  id: string;
  exerciseId: string;
  exerciseName: string;
  category: string | null;
  imageUrl: string | null;
  measurementType: string;
  order: number;
  status: string;
  sets: WorkoutDetailSet[];
}

export interface WorkoutDetail {
  id: string;
  userId: string;
  name: string;
  startedAt: string | null;
  endedAt: string | null;
  durationSec: number | null;
  totalVolume: number;
  totalSets: number;
  notes: string | null;
  createdAt: string;
  exercises: WorkoutDetailExercise[];
}

// ─── Exercise Detail (GET /api/exercises/[id]) ──────────────

export interface ExerciseDetail {
  id: string;
  name: string;
  description: string | null;
  howTo: string | null;
  instructions: string[];
  category: string | null;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  equipment: string[];
  measurementType: string;
  imageUrl: string | null;
  images: string[];
  source: string;
  sourceId: number | null;
}
