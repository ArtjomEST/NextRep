ALTER TABLE "workout_presets" ADD COLUMN "updated_at" timestamp with time zone NOT NULL DEFAULT now();
