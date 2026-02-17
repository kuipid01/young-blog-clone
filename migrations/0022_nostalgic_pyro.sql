ALTER TABLE "affiliate_commissions" DROP CONSTRAINT "affiliate_commissions_affiliate_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "affiliate_commissions" ADD CONSTRAINT "affiliate_commissions_affiliate_id_affiliates_id_fk" FOREIGN KEY ("affiliate_id") REFERENCES "public"."affiliates"("id") ON DELETE no action ON UPDATE no action;