CREATE TYPE "public"."log_status" AS ENUM('used', 'unused');--> statement-breakpoint
CREATE TABLE "logs" (
	"id" varchar(30) PRIMARY KEY NOT NULL,
	"log_details" text NOT NULL,
	"status" "log_status" DEFAULT 'unused' NOT NULL,
	"product_id" varchar NOT NULL,
	"order_id" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "logs_order_id_unique" UNIQUE("order_id")
);
--> statement-breakpoint
ALTER TABLE "logs" ADD CONSTRAINT "logs_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "logs" ADD CONSTRAINT "logs_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;