export interface User {
  id: string;
  name: string;
  weight: number;
  height: number;
  age: number;
  goal: string;
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  units: 'kg' | 'lbs';
  streak: number;
}

export interface Exercise {
  id: string;
  name: string;
  muscleGroups: MuscleGroup[];
  /** From DB `exercises.primary_muscles` when available (exercise picker). */
  primaryMuscles?: string[];
  /** From DB `exercises.secondary_muscles` when available. */
  secondaryMuscles?: string[];
  equipment: string;
  description?: string;
  howTo?: string;
  imageUrl?: string;
  measurementType?: 'weight_reps' | 'reps_only' | 'time' | 'cardio';
}

export type MuscleGroup = 'Chest' | 'Back' | 'Legs' | 'Shoulders' | 'Arms' | 'Core';

export interface WorkoutSet {
  id: string;
  weight: number;
  reps: number;
  completed: boolean;
  createdAt: string;
}

export type ExerciseStatus = 'pending' | 'completed';

export interface WorkoutExercise {
  id: string;
  exerciseId: string;
  exerciseName: string;
  muscleGroups: MuscleGroup[];
  primaryMuscles?: string[];
  secondaryMuscles?: string[];
  equipment: string;
  order: number;
  sets: WorkoutSet[];
  status: ExerciseStatus;
  measurementType?: 'weight_reps' | 'reps_only' | 'time' | 'cardio';
}

export interface Workout {
  id: string;
  name: string;
  date: string;
  startedAt: string;
  endedAt: string;
  exercises: WorkoutExercise[];
  totalVolume: number;
  duration: number;
  improvement: number;
}

export type WorkoutStatus = 'planning' | 'active' | 'finished';

export interface CardioTimerState {
  startedAt: number | null;
  elapsed: number;
  params: Record<string, number>;
}

export interface WorkoutDraft {
  id: string;
  name: string;
  status: WorkoutStatus;
  startedAt: string | null;
  endedAt: string | null;
  exercises: WorkoutExercise[];
  activeExerciseId: string | null;
  cardioTimers: Record<string, CardioTimerState>;
}

export interface WeeklyDataPoint {
  day: string;
  value: number;
}

export interface OverviewStats {
  totalWorkouts: number;
  totalVolume: number;
  prCount: number;
}

export type TimePeriod = 'This Week' | 'This Month' | 'All Time';

export type TabId = 'home' | 'history' | 'community' | 'account';
