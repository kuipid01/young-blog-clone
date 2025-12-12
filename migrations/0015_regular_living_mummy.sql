ALTER TABLE "users" ADD COLUMN "bvn" text;--> statement-breakpoint
ALTER TABLE "wallets" ADD COLUMN "bank_name" varchar(255);--> statement-breakpoint
ALTER TABLE "wallets" ADD COLUMN "flw_ref" varchar(255);