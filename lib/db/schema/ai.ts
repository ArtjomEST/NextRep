import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { users } from './users';
import { workouts } from './workouts';

export const aiMessages = pgTable(
  'ai_messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: varchar('role', { length: 16 }).notNull(),
    content: text('content').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index('ai_messages_user_id_created_at_idx').on(t.userId, t.createdAt),
  ],
);

export const aiWorkoutReports = pgTable(
  'ai_workout_reports',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    workoutId: uuid('workout_id')
      .notNull()
      .references(() => workouts.id, { onDelete: 'cascade' }),
    report: text('report').notNull(),
    score: integer('score').notNull(),
    volumeScore: integer('volume_score').notNull(),
    intensityScore: integer('intensity_score').notNull(),
    consistencyScore: integer('consistency_score').notNull(),
    durationScore: integer('duration_score').notNull(),
    prBonus: integer('pr_bonus').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex('ai_workout_reports_user_workout_idx').on(
      t.userId,
      t.workoutId,
    ),
    index('ai_workout_reports_workout_id_idx').on(t.workoutId),
  ],
);
