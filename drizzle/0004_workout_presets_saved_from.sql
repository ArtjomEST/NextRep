ALTER TABLE "workout_presets" ADD COLUMN IF NOT EXISTS "saved_from_preset_id" uuid;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "workout_presets" ADD CONSTRAINT "workout_presets_saved_from_preset_id_workout_presets_id_fk" FOREIGN KEY ("saved_from_preset_id") REFERENCES "public"."workout_presets"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "workout_presets_user_saved_from_idx" ON "workout_presets" ("user_id", "saved_from_preset_id");
