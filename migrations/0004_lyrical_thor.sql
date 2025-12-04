ALTER TABLE "payments" DROP CONSTRAINT "payments_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "payments" ADD PRIMARY KEY ("id");--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "id" SET DATA TYPE serial;--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "user_id" integer;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;