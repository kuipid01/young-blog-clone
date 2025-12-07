import { NextResponse } from "next/server";

import { eq } from "drizzle-orm";
import { db } from "../../../../lib/db";
import { referrals } from "../../../../lib/schema";

export type ReferralType = {
  id: string;
  referredUserId: string;
  referrerUserId: string;
  createdAt: Date;
};
export async function GET(
  req: Request,
  ctx: RouteContext<"/api/referrals/[userId]">
) {
  const { userId } = await ctx.params;
  const data: ReferralType[] = await db
    .select()
    .from(referrals)
    .where(eq(referrals.referrerUserId, userId));
  return NextResponse.json({ success: true, referrals: data });
}
