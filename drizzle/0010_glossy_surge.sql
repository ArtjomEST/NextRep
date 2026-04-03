CREATE TABLE "timer_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"workout_id" uuid NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"paused" boolean DEFAULT false NOT NULL,
	"remaining_ms" integer,
	"notified" boolean DEFAULT false NOT NULL,
	"telegram_msg_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "timer_sessions" ADD CONSTRAINT "timer_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;