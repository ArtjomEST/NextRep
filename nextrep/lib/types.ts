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
  equipment: string;
}

export type MuscleGroup = 'Chest' | 'Back' | 'Legs' | 'Shoulders' | 'Arms' | 'Core';

export interface WorkoutSet {
  reps: number;
  weight: number;
}

export interface WorkoutExercise {
  exerciseId: string;
  exerciseName: string;
  sets: WorkoutSet[];
}

export interface Workout {
  id: string;
  name: string;
  date: string;
  exercises: WorkoutExercise[];
  totalVolume: number;
  duration: number;
  improvement: number;
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

export type TabId = 'home' | 'history' | 'exercises' | 'account';
