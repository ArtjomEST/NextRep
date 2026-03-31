ALTER TYPE "public"."measurement_type" ADD VALUE 'cardio';--> statement-breakpoint
ALTER TABLE "workout_sets" ADD COLUMN "cardio_data" jsonb DEFAULT 'null'::jsonb;