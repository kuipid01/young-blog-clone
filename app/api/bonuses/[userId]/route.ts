import { NextResponse } from "next/server";

import { eq } from "drizzle-orm";
import { db } from "../../../../lib/db";
import { bonuses } from "../../../../lib/schema";

export interface BonusType {
  id: string;
  referrerUserId: string;
  referredUserId: string;
  paymentId: string;
  bonusAmount: string;
  createdAt: Date;
  status: string | null;
}

export async function GET(
  req: Request,
  ctx: RouteContext<"/api/bonuses/[userId]">
) {
  const { userId } = await ctx.params;
  const data: BonusType[] = await db
    .select()
    .from(bonuses)
    .where(eq(bonuses.referrerUserId, userId));

  return NextResponse.json({ success: true, bonuses: data });
}
