ALTER TABLE "users" ADD COLUMN "must_change_password" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "profile_completed" boolean DEFAULT false NOT NULL;
UPDATE "users" SET "must_change_password" = false, "profile_completed" = true;
