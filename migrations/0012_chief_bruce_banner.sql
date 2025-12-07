CREATE TABLE "bonuses" (
	"id" varchar(30) PRIMARY KEY NOT NULL,
	"referrer_user_id" varchar(30) NOT NULL,
	"referred_user_id" varchar(30) NOT NULL,
	"payment_id" varchar(30) NOT NULL,
	"bonus_amount" numeric NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "referrals" (
	"id" varchar(30) PRIMARY KEY NOT NULL,
	"referred_user_id" varchar(30) NOT NULL,
	"referrer_user_id" varchar(30) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "referralCode" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "referralCode" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "bonuses" ADD CONSTRAINT "bonuses_referrer_user_id_users_id_fk" FOREIGN KEY ("referrer_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bonuses" ADD CONSTRAINT "bonuses_referred_user_id_users_id_fk" FOREIGN KEY ("referred_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bonuses" ADD CONSTRAINT "bonuses_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referred_user_id_users_id_fk" FOREIGN KEY ("referred_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referrer_user_id_users_id_fk" FOREIGN KEY ("referrer_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_referralCode_unique" UNIQUE("referralCode");