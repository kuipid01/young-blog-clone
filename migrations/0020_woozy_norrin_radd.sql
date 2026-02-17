CREATE TYPE "public"."affiliate_status" AS ENUM('pending_payment', 'pending_approval', 'active', 'rejected', 'suspended');--> statement-breakpoint
CREATE TYPE "public"."bonus_type" AS ENUM('referral', 'store');--> statement-breakpoint
CREATE TYPE "public"."withdrawal_status" AS ENUM('pending', 'approved', 'rejected', 'processing');--> statement-breakpoint
CREATE TABLE "affiliate_commissions" (
	"id" varchar(30) PRIMARY KEY NOT NULL,
	"order_id" varchar(30) NOT NULL,
	"affiliate_id" varchar(30) NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"rate" numeric(5, 2) NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "affiliates" (
	"id" varchar(30) PRIMARY KEY NOT NULL,
	"user_id" varchar(30) NOT NULL,
	"status" "affiliate_status" DEFAULT 'pending_payment' NOT NULL,
	"commission_rate" numeric(5, 2) DEFAULT '20.00' NOT NULL,
	"total_earnings" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"current_balance" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"bank_name" varchar,
	"account_number" varchar,
	"account_name" varchar,
	"payment_proof" text,
	"payment_reference" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "affiliates_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "withdrawal_metadata" (
	"id" varchar(30) PRIMARY KEY NOT NULL,
	"withdrawal_id" varchar(30) NOT NULL,
	"reference" varchar NOT NULL,
	"fee" numeric(12, 2),
	"currency" varchar DEFAULT 'NGN',
	"status" varchar DEFAULT 'processing',
	"metadata" json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "withdrawal_metadata_reference_unique" UNIQUE("reference")
);
--> statement-breakpoint
CREATE TABLE "withdrawals" (
	"id" varchar(30) PRIMARY KEY NOT NULL,
	"affiliate_id" varchar(30) NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"status" "withdrawal_status" DEFAULT 'pending' NOT NULL,
	"bank_name" varchar,
	"account_number" varchar,
	"account_name" varchar,
	"admin_note" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bonuses" ALTER COLUMN "referrer_user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "bonuses" ALTER COLUMN "referred_user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "bonuses" ALTER COLUMN "payment_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "bonuses" ALTER COLUMN "status" SET DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "bonuses" ADD COLUMN "order_id" varchar(30);--> statement-breakpoint
ALTER TABLE "bonuses" ADD COLUMN "type" "bonus_type" DEFAULT 'referral' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "total_amount" numeric(12, 2) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "net_amount" numeric(12, 2) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "referral_amount" numeric(12, 2) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "referrer_id" varchar(30);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_affiliate" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "affiliate_commissions" ADD CONSTRAINT "affiliate_commissions_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliate_commissions" ADD CONSTRAINT "affiliate_commissions_affiliate_id_users_id_fk" FOREIGN KEY ("affiliate_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliates" ADD CONSTRAINT "affiliates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "withdrawal_metadata" ADD CONSTRAINT "withdrawal_metadata_withdrawal_id_withdrawals_id_fk" FOREIGN KEY ("withdrawal_id") REFERENCES "public"."withdrawals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "withdrawals" ADD CONSTRAINT "withdrawals_affiliate_id_affiliates_id_fk" FOREIGN KEY ("affiliate_id") REFERENCES "public"."affiliates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bonuses" ADD CONSTRAINT "bonuses_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_referrer_id_users_id_fk" FOREIGN KEY ("referrer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;