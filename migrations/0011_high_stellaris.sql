ALTER TABLE "logs" DROP CONSTRAINT "logs_order_id_unique";--> statement-breakpoint
ALTER TABLE "logs" DROP CONSTRAINT "logs_order_id_orders_id_fk";
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "log_id" varchar(30) NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_log_id_logs_id_fk" FOREIGN KEY ("log_id") REFERENCES "public"."logs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "logs" DROP COLUMN "order_id";