CREATE TABLE "results" (
	"id" serial PRIMARY KEY NOT NULL,
	"image_id" integer,
	"user_id" integer,
	"score" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_session" ADD COLUMN "meta" jsonb;--> statement-breakpoint
ALTER TABLE "results" ADD CONSTRAINT "results_image_id_image_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."image"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "results" ADD CONSTRAINT "results_user_id_user_session_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_session"("id") ON DELETE no action ON UPDATE no action;