CREATE TABLE "documents" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"filename" text NOT NULL,
	"content" text NOT NULL,
	"word_count" integer NOT NULL,
	"ai_score" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "rewrite_jobs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"input_text" text NOT NULL,
	"style_text" text,
	"content_mix_text" text,
	"custom_instructions" text,
	"selected_presets" jsonb,
	"provider" text NOT NULL,
	"chunks" jsonb,
	"selected_chunk_ids" jsonb,
	"mixing_mode" text,
	"output_text" text,
	"input_ai_score" integer,
	"output_ai_score" integer,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "visitors" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"visitor_id" text NOT NULL,
	"first_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "visitors_visitor_id_unique" UNIQUE("visitor_id")
);
