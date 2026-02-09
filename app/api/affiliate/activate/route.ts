
import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../lib/db";
import { affiliates, wallets } from "../../../../lib/schema";
import { eq, sql } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const { userId, paymentProof, paymentReference } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { message: "User ID is required" },
        { status: 400 }
      );
    }

    if (!paymentReference) {
      return NextResponse.json(
        { message: "Payment reference is required" },
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

    // Create or Update Affiliate Profile with proof
    if (existingAffiliate) {
      await db
        .update(affiliates)
        .set({
          status: "pending_approval",
          paymentProof: paymentProof || null,
          paymentReference: paymentReference,
          updatedAt: new Date(),
        })
        .where(eq(affiliates.id, existingAffiliate.id));
    } else {
      await db.insert(affiliates).values({
        userId,
        status: "pending_approval",
        paymentProof: paymentProof || null,
        paymentReference: paymentReference,
        commissionRate: "20.00", // Default 20%
        totalEarnings: "0.00",
        currentBalance: "0.00",
      });
    }

    return NextResponse.json({
      success: true,
      message: "Affiliate request submitted for approval",
    });
  } catch (error) {
    console.error("Error submitting affiliate request:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

