CREATE TYPE "public"."withdrawal_type" AS ENUM('automatic', 'manual');--> statement-breakpoint
ALTER TABLE "withdrawals" ADD COLUMN "type" "withdrawal_type" DEFAULT 'automatic' NOT NULL;