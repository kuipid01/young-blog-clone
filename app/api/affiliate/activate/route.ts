
import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../lib/db";
import { affiliates, wallets } from "../../../../lib/schema";
import { eq, sql } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { message: "User ID is required" },
        { status: 400 }
      );
    }

    // Check if already affiliate
    const existingAffiliate = await db.query.affiliates.findFirst({
      where: eq(affiliates.userId, userId),
    });

    if (existingAffiliate && existingAffiliate.status === "active") {
      return NextResponse.json(
        { message: "User is already an active affiliate" },
        { status: 400 }
      );
    }

    const ACTIVATION_FEE = 1000;

    // Check wallet balance
    const userWallet = await db.query.wallets.findFirst({
      where: eq(wallets.userId, userId),
    });

    if (!userWallet) {
      return NextResponse.json(
        { message: "Wallet not found" },
        { status: 404 }
      );
    }

    const currentBalance = parseFloat(userWallet.walletBalance);

    if (currentBalance < ACTIVATION_FEE) {
      return NextResponse.json(
        { message: "Insufficient wallet balance. Please fund your wallet." },
        { status: 400 }
      );
    }

    // Perform Transaction
    await db.transaction(async (tx) => {
      // 1. Debit Wallet
      await tx
        .update(wallets)
        .set({
          walletBalance: sql`${wallets.walletBalance} - ${ACTIVATION_FEE}`,
          updatedAt: new Date(),
        })
        .where(eq(wallets.userId, userId));

      // 2. Create or Update Affiliate Profile
      if (existingAffiliate) {
        await tx
          .update(affiliates)
          .set({
            status: "active", // Or pending_approval
            updatedAt: new Date(),
          })
          .where(eq(affiliates.id, existingAffiliate.id));
      } else {
        await tx.insert(affiliates).values({
          userId,
          status: "active", // Or pending_approval
          commissionRate: "10.00", // Default 10% or as per requirement
          totalEarnings: "0.00",
          currentBalance: "0.00",
        });
      }
    });

    return NextResponse.json({
      success: true,
      message: "Affiliate account activated successfully",
    });
  } catch (error) {
    console.error("Error activating affiliate:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
