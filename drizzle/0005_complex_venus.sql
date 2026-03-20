CREATE TABLE "ai_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"role" varchar(16) NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_workout_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"workout_id" uuid NOT NULL,
	"report" text NOT NULL,
	"score" integer NOT NULL,
	"volume_score" integer NOT NULL,
	"intensity_score" integer NOT NULL,
	"consistency_score" integer NOT NULL,
	"duration_score" integer NOT NULL,
	"pr_bonus" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "is_pro" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "ai_messages" ADD CONSTRAINT "ai_messages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_workout_reports" ADD CONSTRAINT "ai_workout_reports_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_workout_reports" ADD CONSTRAINT "ai_workout_reports_workout_id_workouts_id_fk" FOREIGN KEY ("workout_id") REFERENCES "public"."workouts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ai_messages_user_id_created_at_idx" ON "ai_messages" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "ai_workout_reports_user_workout_idx" ON "ai_workout_reports" USING btree ("user_id","workout_id");--> statement-breakpoint
CREATE INDEX "ai_workout_reports_workout_id_idx" ON "ai_workout_reports" USING btree ("workout_id");
