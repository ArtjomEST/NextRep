import type {
  User,
  Exercise,
  Workout,
  WeeklyDataPoint,
  OverviewStats,
} from './types';

export const mockUser: User = {
  id: '1',
  name: 'Alex',
  weight: 82,
  height: 180,
  age: 27,
  goal: 'Muscle Growth',
  experienceLevel: 'intermediate',
  units: 'kg',
  streak: 12,
};

export const mockExercises: Exercise[] = [
  { id: '1', name: 'Bench Press', muscleGroups: ['Chest', 'Arms'], equipment: 'Barbell' },
  { id: '2', name: 'Squat', muscleGroups: ['Legs'], equipment: 'Barbell' },
  { id: '3', name: 'Deadlift', muscleGroups: ['Back', 'Legs'], equipment: 'Barbell' },
  { id: '4', name: 'Overhead Press', muscleGroups: ['Shoulders', 'Arms'], equipment: 'Barbell' },
  { id: '5', name: 'Barbell Row', muscleGroups: ['Back', 'Arms'], equipment: 'Barbell' },
  { id: '6', name: 'Pull-up', muscleGroups: ['Back', 'Arms'], equipment: 'Bodyweight' },
  { id: '7', name: 'Dumbbell Curl', muscleGroups: ['Arms'], equipment: 'Dumbbell' },
  { id: '8', name: 'Lateral Raise', muscleGroups: ['Shoulders'], equipment: 'Dumbbell' },
  { id: '9', name: 'Leg Press', muscleGroups: ['Legs'], equipment: 'Machine' },
  { id: '10', name: 'Plank', muscleGroups: ['Core'], equipment: 'Bodyweight' },
  { id: '11', name: 'Cable Fly', muscleGroups: ['Chest'], equipment: 'Cable' },
  { id: '12', name: 'Romanian Deadlift', muscleGroups: ['Legs', 'Back'], equipment: 'Barbell' },
  { id: '13', name: 'Tricep Pushdown', muscleGroups: ['Arms'], equipment: 'Cable' },
  { id: '14', name: 'Face Pull', muscleGroups: ['Shoulders', 'Back'], equipment: 'Cable' },
  { id: '15', name: 'Hanging Leg Raise', muscleGroups: ['Core'], equipment: 'Bodyweight' },
];

export const mockWorkouts: Workout[] = [
  {
    id: '1',
    name: 'Push Day',
    date: '2026-02-27',
    exercises: [
      { exerciseId: '1', exerciseName: 'Bench Press', sets: [{ reps: 8, weight: 90 }, { reps: 8, weight: 90 }, { reps: 6, weight: 95 }] },
      { exerciseId: '4', exerciseName: 'Overhead Press', sets: [{ reps: 10, weight: 50 }, { reps: 8, weight: 55 }] },
      { exerciseId: '11', exerciseName: 'Cable Fly', sets: [{ reps: 12, weight: 15 }, { reps: 12, weight: 15 }] },
    ],
    totalVolume: 3210,
    duration: 58,
    improvement: 4.2,
  },
  {
    id: '2',
    name: 'Pull Day',
    date: '2026-02-25',
    exercises: [
      { exerciseId: '3', exerciseName: 'Deadlift', sets: [{ reps: 5, weight: 140 }, { reps: 5, weight: 140 }, { reps: 3, weight: 150 }] },
      { exerciseId: '5', exerciseName: 'Barbell Row', sets: [{ reps: 8, weight: 70 }, { reps: 8, weight: 70 }] },
      { exerciseId: '6', exerciseName: 'Pull-up', sets: [{ reps: 10, weight: 0 }, { reps: 8, weight: 0 }] },
    ],
    totalVolume: 3670,
    duration: 62,
    improvement: 2.8,
  },
  {
    id: '3',
    name: 'Leg Day',
    date: '2026-02-23',
    exercises: [
      { exerciseId: '2', exerciseName: 'Squat', sets: [{ reps: 6, weight: 120 }, { reps: 6, weight: 120 }, { reps: 5, weight: 125 }] },
      { exerciseId: '9', exerciseName: 'Leg Press', sets: [{ reps: 10, weight: 180 }, { reps: 10, weight: 180 }] },
      { exerciseId: '12', exerciseName: 'Romanian Deadlift', sets: [{ reps: 10, weight: 80 }, { reps: 10, weight: 80 }] },
    ],
    totalVolume: 6485,
    duration: 55,
    improvement: -1.3,
  },
  {
    id: '4',
    name: 'Upper Body',
    date: '2026-02-21',
    exercises: [
      { exerciseId: '1', exerciseName: 'Bench Press', sets: [{ reps: 8, weight: 85 }, { reps: 8, weight: 85 }] },
      { exerciseId: '5', exerciseName: 'Barbell Row', sets: [{ reps: 8, weight: 65 }, { reps: 8, weight: 65 }] },
      { exerciseId: '8', exerciseName: 'Lateral Raise', sets: [{ reps: 12, weight: 10 }, { reps: 12, weight: 10 }] },
    ],
    totalVolume: 3640,
    duration: 50,
    improvement: 3.1,
  },
];

export const mockWeeklyData: WeeklyDataPoint[] = [
  { day: 'Mon', value: 2800 },
  { day: 'Tue', value: 0 },
  { day: 'Wed', value: 3200 },
  { day: 'Thu', value: 0 },
  { day: 'Fri', value: 3670 },
  { day: 'Sat', value: 0 },
  { day: 'Sun', value: 3210 },
];

export const mockOverviewStats: OverviewStats = {
  totalWorkouts: 47,
  totalVolume: 142850,
  prCount: 8,
};

export const exerciseChips = ['Bench Press', 'Squat', 'Deadlift', 'OHP', 'Row'];
