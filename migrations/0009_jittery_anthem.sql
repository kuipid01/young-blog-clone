CREATE TABLE "orders" (
	"id" varchar(30) PRIMARY KEY NOT NULL,
	"user_id" varchar(30) NOT NULL,
	"product_id" varchar(30) NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"total_price" numeric(12, 2) NOT NULL,
	"status" varchar(50) DEFAULT 'pending_debit' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;