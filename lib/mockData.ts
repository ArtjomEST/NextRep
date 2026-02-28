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
    startedAt: '2026-02-27T09:00:00Z',
    endedAt: '2026-02-27T09:58:00Z',
    exercises: [
      { id: 'we1', exerciseId: '1', exerciseName: 'Bench Press', muscleGroups: ['Chest', 'Arms'], equipment: 'Barbell', order: 0, status: 'completed', sets: [{ id: 's1', reps: 8, weight: 90, completed: true, createdAt: '2026-02-27T09:05:00Z' }, { id: 's2', reps: 8, weight: 90, completed: true, createdAt: '2026-02-27T09:10:00Z' }, { id: 's3', reps: 6, weight: 95, completed: true, createdAt: '2026-02-27T09:15:00Z' }] },
      { id: 'we2', exerciseId: '4', exerciseName: 'Overhead Press', muscleGroups: ['Shoulders', 'Arms'], equipment: 'Barbell', order: 1, status: 'completed', sets: [{ id: 's4', reps: 10, weight: 50, completed: true, createdAt: '2026-02-27T09:25:00Z' }, { id: 's5', reps: 8, weight: 55, completed: true, createdAt: '2026-02-27T09:30:00Z' }] },
      { id: 'we3', exerciseId: '11', exerciseName: 'Cable Fly', muscleGroups: ['Chest'], equipment: 'Cable', order: 2, status: 'completed', sets: [{ id: 's6', reps: 12, weight: 15, completed: true, createdAt: '2026-02-27T09:40:00Z' }, { id: 's7', reps: 12, weight: 15, completed: true, createdAt: '2026-02-27T09:45:00Z' }] },
    ],
    totalVolume: 3210,
    duration: 58,
    improvement: 4.2,
  },
  {
    id: '2',
    name: 'Pull Day',
    date: '2026-02-25',
    startedAt: '2026-02-25T10:00:00Z',
    endedAt: '2026-02-25T11:02:00Z',
    exercises: [
      { id: 'we4', exerciseId: '3', exerciseName: 'Deadlift', muscleGroups: ['Back', 'Legs'], equipment: 'Barbell', order: 0, status: 'completed', sets: [{ id: 's8', reps: 5, weight: 140, completed: true, createdAt: '2026-02-25T10:10:00Z' }, { id: 's9', reps: 5, weight: 140, completed: true, createdAt: '2026-02-25T10:18:00Z' }, { id: 's10', reps: 3, weight: 150, completed: true, createdAt: '2026-02-25T10:26:00Z' }] },
      { id: 'we5', exerciseId: '5', exerciseName: 'Barbell Row', muscleGroups: ['Back', 'Arms'], equipment: 'Barbell', order: 1, status: 'completed', sets: [{ id: 's11', reps: 8, weight: 70, completed: true, createdAt: '2026-02-25T10:35:00Z' }, { id: 's12', reps: 8, weight: 70, completed: true, createdAt: '2026-02-25T10:42:00Z' }] },
      { id: 'we6', exerciseId: '6', exerciseName: 'Pull-up', muscleGroups: ['Back', 'Arms'], equipment: 'Bodyweight', order: 2, status: 'completed', sets: [{ id: 's13', reps: 10, weight: 0, completed: true, createdAt: '2026-02-25T10:50:00Z' }, { id: 's14', reps: 8, weight: 0, completed: true, createdAt: '2026-02-25T10:55:00Z' }] },
    ],
    totalVolume: 3670,
    duration: 62,
    improvement: 2.8,
  },
  {
    id: '3',
    name: 'Leg Day',
    date: '2026-02-23',
    startedAt: '2026-02-23T08:00:00Z',
    endedAt: '2026-02-23T08:55:00Z',
    exercises: [
      { id: 'we7', exerciseId: '2', exerciseName: 'Squat', muscleGroups: ['Legs'], equipment: 'Barbell', order: 0, status: 'completed', sets: [{ id: 's15', reps: 6, weight: 120, completed: true, createdAt: '2026-02-23T08:10:00Z' }, { id: 's16', reps: 6, weight: 120, completed: true, createdAt: '2026-02-23T08:18:00Z' }, { id: 's17', reps: 5, weight: 125, completed: true, createdAt: '2026-02-23T08:25:00Z' }] },
      { id: 'we8', exerciseId: '9', exerciseName: 'Leg Press', muscleGroups: ['Legs'], equipment: 'Machine', order: 1, status: 'completed', sets: [{ id: 's18', reps: 10, weight: 180, completed: true, createdAt: '2026-02-23T08:35:00Z' }, { id: 's19', reps: 10, weight: 180, completed: true, createdAt: '2026-02-23T08:42:00Z' }] },
      { id: 'we9', exerciseId: '12', exerciseName: 'Romanian Deadlift', muscleGroups: ['Legs', 'Back'], equipment: 'Barbell', order: 2, status: 'completed', sets: [{ id: 's20', reps: 10, weight: 80, completed: true, createdAt: '2026-02-23T08:48:00Z' }, { id: 's21', reps: 10, weight: 80, completed: true, createdAt: '2026-02-23T08:53:00Z' }] },
    ],
    totalVolume: 6485,
    duration: 55,
    improvement: -1.3,
  },
  {
    id: '4',
    name: 'Upper Body',
    date: '2026-02-21',
    startedAt: '2026-02-21T17:00:00Z',
    endedAt: '2026-02-21T17:50:00Z',
    exercises: [
      { id: 'we10', exerciseId: '1', exerciseName: 'Bench Press', muscleGroups: ['Chest', 'Arms'], equipment: 'Barbell', order: 0, status: 'completed', sets: [{ id: 's22', reps: 8, weight: 85, completed: true, createdAt: '2026-02-21T17:10:00Z' }, { id: 's23', reps: 8, weight: 85, completed: true, createdAt: '2026-02-21T17:18:00Z' }] },
      { id: 'we11', exerciseId: '5', exerciseName: 'Barbell Row', muscleGroups: ['Back', 'Arms'], equipment: 'Barbell', order: 1, status: 'completed', sets: [{ id: 's24', reps: 8, weight: 65, completed: true, createdAt: '2026-02-21T17:28:00Z' }, { id: 's25', reps: 8, weight: 65, completed: true, createdAt: '2026-02-21T17:35:00Z' }] },
      { id: 'we12', exerciseId: '8', exerciseName: 'Lateral Raise', muscleGroups: ['Shoulders'], equipment: 'Dumbbell', order: 2, status: 'completed', sets: [{ id: 's26', reps: 12, weight: 10, completed: true, createdAt: '2026-02-21T17:42:00Z' }, { id: 's27', reps: 12, weight: 10, completed: true, createdAt: '2026-02-21T17:48:00Z' }] },
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

export const mockLastPerformance: Record<string, { weight: number; reps: number; sets: number }> = {
  '1': { weight: 90, reps: 8, sets: 3 },
  '2': { weight: 120, reps: 6, sets: 3 },
  '3': { weight: 140, reps: 5, sets: 3 },
  '4': { weight: 50, reps: 10, sets: 2 },
  '5': { weight: 70, reps: 8, sets: 2 },
  '6': { weight: 0, reps: 10, sets: 2 },
  '7': { weight: 14, reps: 12, sets: 3 },
  '8': { weight: 10, reps: 12, sets: 2 },
  '9': { weight: 180, reps: 10, sets: 2 },
  '10': { weight: 0, reps: 0, sets: 3 },
  '11': { weight: 15, reps: 12, sets: 2 },
  '12': { weight: 80, reps: 10, sets: 2 },
  '13': { weight: 25, reps: 12, sets: 3 },
  '14': { weight: 15, reps: 15, sets: 3 },
  '15': { weight: 0, reps: 12, sets: 3 },
};
