import { pgTable, uuid, integer, boolean, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users';

// workoutId is the client-side draft.id (a local UUID generated before the workout is saved to DB).
// It is NOT a FK to the workouts table since the timer is armed before the workout is persisted.
export const timerSessions = pgTable('timer_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  workoutId: uuid('workout_id').notNull(),
  endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
  paused: boolean('paused').notNull().default(false),
  remainingMs: integer('remaining_ms'), // set when paused
  notified: boolean('notified').notNull().default(false),
  telegramMsgId: integer('telegram_msg_id'), // filled after message is sent
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
