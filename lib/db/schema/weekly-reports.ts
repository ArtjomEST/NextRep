import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { users } from './users';

export const weeklyReports = pgTable('weekly_reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  weekStart: varchar('week_start', { length: 10 }).notNull(), // 'YYYY-MM-DD' (Monday, UTC)
  sentAt: timestamp('sent_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex('weekly_reports_user_week_idx').on(t.userId, t.weekStart),
]);
