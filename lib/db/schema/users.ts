import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  integer,
  numeric,
  pgEnum,
  uniqueIndex,
  jsonb,
} from 'drizzle-orm/pg-core';

export const unitsEnum = pgEnum('units', ['kg', 'lb']);
export const experienceLevelEnum = pgEnum('experience_level', ['beginner', 'intermediate', 'advanced']);
export const goalEnum = pgEnum('goal', ['muscle_growth', 'strength', 'endurance', 'weight_loss', 'general_fitness']);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  telegramUserId: varchar('telegram_user_id', { length: 64 }).unique(),
  username: varchar('username', { length: 128 }),
  firstName: varchar('first_name', { length: 128 }),
  lastName: varchar('last_name', { length: 128 }),
  /** Telegram WebApp user photo_url when available */
  avatarUrl: text('avatar_url'),
  isLinked: boolean('is_linked').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (t) => [
  uniqueIndex('users_telegram_user_id_idx').on(t.telegramUserId),
]);

export const userProfiles = pgTable('user_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  heightCm: integer('height_cm'),
  weightKg: numeric('weight_kg', { precision: 5, scale: 1 }),
  age: integer('age'),
  units: unitsEnum('units').notNull().default('kg'),
  experienceLevel: experienceLevelEnum('experience_level'),
  goal: goalEnum('goal'),
  splitPreference: varchar('split_preference', { length: 32 }),
  trainingDaysPerWeek: integer('training_days_per_week'),
  bestLifts: jsonb('best_lifts').$type<{ benchPress?: number; squat?: number; deadlift?: number }>(),
  injuries: jsonb('injuries').$type<string[]>(),
  onboardingCompleted: boolean('onboarding_completed').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});
