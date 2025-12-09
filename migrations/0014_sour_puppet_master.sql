ALTER TABLE "orders" DROP CONSTRAINT "orders_product_id_products_id_fk";
--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "product_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "log_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "status" SET DATA TYPE varchar;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'pending_debit';--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "trans_id" varchar(50);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "data" json NOT NULL;