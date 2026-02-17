
import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../../lib/db";
import { withdrawals, affiliates } from "../../../../../lib/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();

  try {
    const { userId } = await params;

    if (!userId) {
      return NextResponse.json(
        { message: "User ID is required" },
        { status: 400 }
      );
    }

    // 1. Get Affiliate Profile
    const affiliate = await db.query.affiliates.findFirst({
      where: eq(affiliates.userId, userId),
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

    // 2. Get withdrawals
    const withdrawalList = await db.query.withdrawals.findMany({
      where: eq(withdrawals.affiliateId, affiliate.id),
      orderBy: [desc(withdrawals.createdAt)],
    });

    console.info("[AFFILIATE_WITHDRAWALS][FETCHED]", {
      requestId,
      count: withdrawalList.length,
      durationMs: Date.now() - startTime,
    });

    return NextResponse.json({
      success: true,
      data: withdrawalList,
    });
  } catch (error: any) {
    console.error("[AFFILIATE_WITHDRAWALS][ERROR]", {
      requestId,
      message: error?.message,
    });

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
