import {
  pgTable,
  uuid,
  varchar,
  text,
  jsonb,
  timestamp,
  integer,
  pgEnum,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';

export const exerciseSourceEnum = pgEnum('exercise_source', ['wger', 'custom']);
export const measurementTypeEnum = pgEnum('measurement_type', ['weight_reps', 'reps_only', 'time']);

export const exercises = pgTable('exercises', {
  id: uuid('id').primaryKey().defaultRandom(),
  source: exerciseSourceEnum('source').notNull().default('wger'),
  sourceId: integer('source_id'),
  name: varchar('name', { length: 256 }).notNull(),
  description: text('description'),
  howTo: text('how_to'),
  primaryMuscles: jsonb('primary_muscles').$type<string[]>(),
  secondaryMuscles: jsonb('secondary_muscles').$type<string[]>(),
  equipment: jsonb('equipment').$type<string[]>(),
  category: varchar('category', { length: 64 }),
  measurementType: measurementTypeEnum('measurement_type').notNull().default('weight_reps'),
  imageUrl: text('image_url'),
  images: jsonb('images').$type<string[]>(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (t) => [
  uniqueIndex('exercises_source_source_id_idx').on(t.source, t.sourceId),
  index('exercises_name_idx').on(t.name),
]);
