import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../../lib/db";
import { affiliateCommissions, affiliates } from "../../../../../lib/schema";
import { eq } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();

  console.info("[AFFILIATE_COMMISSIONS][START]", {
    requestId,
    path: req.nextUrl.pathname,
    method: req.method,
  });

  try {
    const { userId } = await params;

    console.info("[AFFILIATE_COMMISSIONS][PARAMS]", {
      requestId,
      userId,
    });

    if (!userId) {
      console.warn("[AFFILIATE_COMMISSIONS][MISSING_USER_ID]", {
        requestId,
      });

      return NextResponse.json(
        { message: "User ID is required" },
        { status: 400 }
      );
    }

    // 1. Get Affiliate Profile
    const affiliate = await db.query.affiliates.findFirst({
      where: eq(affiliates.userId, userId),
    });

    console.info("[AFFILIATE_COMMISSIONS][AFFILIATE_LOOKUP]", {
      requestId,
      found: Boolean(affiliate),
      affiliateId: affiliate?.id,
    });

    if (!affiliate) {
      return NextResponse.json(
        {
          success: false,
          message: "Affiliate not found",
        },
        { status: 404 }
      );
    }

    // 2. Get commissions
    const commissions = await db.query.affiliateCommissions.findMany({
      where: eq(affiliateCommissions.affiliateId, affiliate.id),
      orderBy: (affiliateCommissions, { desc }) => [
        desc(affiliateCommissions.createdAt),
      ],
    //   with: {
    //     order: true,
    //   },
    });

    console.info("[AFFILIATE_COMMISSIONS][COMMISSIONS_FETCHED]", {
      requestId,
      count: commissions.length,
    });

    // 3. Calculate locked amount (< 12 hours)
    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);

    const lockedCommissions = commissions.filter(
      (c) => new Date(c.createdAt) > twelveHoursAgo
    );

    const lockedAmount = lockedCommissions.reduce(
      (sum, c) => sum + Number(c.amount),
      0
    );

    const totalBalance = Number(affiliate.currentBalance);
    const availableBalance = Math.max(0, totalBalance - lockedAmount);

    console.info("[AFFILIATE_COMMISSIONS][BALANCE_CALCULATION]", {
      requestId,
      totalBalance,
      lockedAmount,
      availableBalance,
      lockedCount: lockedCommissions.length,
    });

    console.info("[AFFILIATE_COMMISSIONS][SUCCESS]", {
      requestId,
      durationMs: Date.now() - startTime,
    });

    return NextResponse.json({
      success: true,
      data: {
        commissions: commissions.map((c) => ({
          ...c,
          isLocked: new Date(c.createdAt) > twelveHoursAgo,
          unlocksAt: new Date(
            new Date(c.createdAt).getTime() + 12 * 60 * 60 * 1000
          ),
        })),
        summary: {
          totalEarnings: Number(affiliate.totalEarnings),
          currentBalance: totalBalance,
          availableBalance,
          lockedAmount,
        },
      },
    });
  } catch (error: any) {
    console.error("[AFFILIATE_COMMISSIONS][ERROR]", {
      requestId,
      message: error?.message,
      stack: error?.stack,
    });

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}