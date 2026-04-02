import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import { users } from './users';

export const deloadRecommendations = pgTable('deload_recommendations', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  status: varchar('status', { length: 16 }).notNull(), // 'good' | 'warning' | 'recommended'
  signals: jsonb('signals').notNull().$type<string[]>(),
  weeklyVolumes: jsonb('weekly_volumes').notNull().$type<{ weekStart: string; volume: number }[]>(),
  aiExplanation: text('ai_explanation'),
  aiPresetData: jsonb('ai_preset_data').$type<{
    name: string;
    exercises: { name: string; sets: number; targetReps: number; targetWeight: number }[];
  } | null>(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
}, (t) => [
  index('deload_recs_user_id_idx').on(t.userId),
  index('deload_recs_user_expires_idx').on(t.userId, t.expiresAt),
]);
