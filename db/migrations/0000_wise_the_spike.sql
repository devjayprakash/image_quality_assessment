CREATE TABLE "batch" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "image_batch" (
	"id" serial PRIMARY KEY NOT NULL,
	"class_name" text NOT NULL,
	"batch_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "image" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"is_first_image" boolean DEFAULT false,
	"image_batch_id" integer,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_session" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "image_batch" ADD CONSTRAINT "image_batch_batch_id_batch_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batch"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "image" ADD CONSTRAINT "image_image_batch_id_image_batch_id_fk" FOREIGN KEY ("image_batch_id") REFERENCES "public"."image_batch"("id") ON DELETE no action ON UPDATE no action;