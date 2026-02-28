import {
  pgTable,
  uuid,
  varchar,
  boolean,
  timestamp,
  integer,
  numeric,
  pgEnum,
  uniqueIndex,
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
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});
