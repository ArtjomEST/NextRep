import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  numeric,
  boolean,
  pgEnum,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { users } from './users';
import { exercises } from './exercises';

export const exerciseStatusEnum = pgEnum('exercise_status', ['pending', 'completed']);

export const workouts = pgTable('workouts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 256 }).notNull(),
  startedAt: timestamp('started_at', { withTimezone: true }),
  endedAt: timestamp('ended_at', { withTimezone: true }),
  durationSec: integer('duration_sec'),
  totalVolume: numeric('total_volume', { precision: 10, scale: 1 }),
  totalSets: integer('total_sets'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('workouts_user_id_idx').on(t.userId),
]);

export const workoutExercises = pgTable('workout_exercises', {
  id: uuid('id').primaryKey().defaultRandom(),
  workoutId: uuid('workout_id').notNull().references(() => workouts.id, { onDelete: 'cascade' }),
  exerciseId: uuid('exercise_id').notNull().references(() => exercises.id, { onDelete: 'restrict' }),
  order: integer('order').notNull(),
  status: exerciseStatusEnum('status').notNull().default('pending'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('workout_exercises_workout_id_idx').on(t.workoutId),
  index('workout_exercises_exercise_id_idx').on(t.exerciseId),
  uniqueIndex('workout_exercises_workout_order_idx').on(t.workoutId, t.order),
]);

export const workoutSets = pgTable('workout_sets', {
  id: uuid('id').primaryKey().defaultRandom(),
  workoutExerciseId: uuid('workout_exercise_id').notNull().references(() => workoutExercises.id, { onDelete: 'cascade' }),
  setIndex: integer('set_index').notNull(),
  weight: numeric('weight', { precision: 7, scale: 2 }),
  reps: integer('reps'),
  seconds: integer('seconds'),
  completed: boolean('completed').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('workout_sets_workout_exercise_id_idx').on(t.workoutExerciseId),
]);
