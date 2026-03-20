import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  jsonb,
  index,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core';
import { users } from './users';

export const workoutPresets = pgTable(
  'workout_presets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 256 }).notNull(),
    exerciseIds: jsonb('exercise_ids').$type<string[]>().notNull().default([]),
    /** Source preset id when this row was created via "save copy" from another user's preset. */
    savedFromPresetId: uuid('saved_from_preset_id').references(
      (): AnyPgColumn => workoutPresets.id,
      { onDelete: 'set null' },
    ),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('workout_presets_user_id_idx').on(t.userId)],
);
