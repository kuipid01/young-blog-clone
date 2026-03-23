ALTER TABLE "orders" ADD COLUMN "refund_items" json;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "refund_faulty_count" integer;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "refund_amount" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "withdrawals" ADD COLUMN "admin_proof" text;