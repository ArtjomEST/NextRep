CREATE TABLE "deload_recommendations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"status" varchar(16) NOT NULL,
	"signals" jsonb NOT NULL,
	"weekly_volumes" jsonb NOT NULL,
	"ai_explanation" text,
	"ai_preset_data" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "deload_dismiss_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "deload_hidden" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "deload_recommendations" ADD CONSTRAINT "deload_recommendations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "deload_recs_user_id_idx" ON "deload_recommendations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "deload_recs_user_expires_idx" ON "deload_recommendations" USING btree ("user_id","expires_at");