-- Add onboarding fields to user_profiles
ALTER TABLE "user_profiles"
  ADD COLUMN IF NOT EXISTS "split_preference" varchar(32),
  ADD COLUMN IF NOT EXISTS "training_days_per_week" integer,
  ADD COLUMN IF NOT EXISTS "best_lifts" jsonb,
  ADD COLUMN IF NOT EXISTS "injuries" jsonb,
  ADD COLUMN IF NOT EXISTS "onboarding_completed" boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "created_at" timestamptz NOT NULL DEFAULT now();
