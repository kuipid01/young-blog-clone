import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "../../../../lib/db";
import { order, referrals, affiliateCommissions, wallets, user, affiliates } from "../../../../lib/schema";

/**
 * TEST API: Creates an order and triggers affiliate commissions
 * without external API calls or complex validations.
 * 
 * Body: { userId: string, productId: string, price: number, quantity: number }
 */
export async function POST(req: Request) {
  try {
    const { userId, productId, price, quantity = 1 } = await req.json();

    if (!userId || !productId || !price) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    const totalPrice = price * quantity;

    // 1. Find Referrer
    const referral = await db.query.referrals.findFirst({
      where: eq(referrals.referredUserId, userId),
    });

    let referrerId = null;
    let referralAmount = 0;
    
    // Only query affiliate if referral exists
    let commissionRate = 20; // default value
    if (referral && referral.referrerUserId) {
      const affiliate = await db.query.affiliates.findFirst({
        where: eq(affiliates.userId, referral.referrerUserId),
      });
      
      commissionRate = Number(affiliate?.commissionRate || 20);
      referrerId = referral.referrerUserId;
      referralAmount = totalPrice * (commissionRate / 100);
    }

    const netAmount = totalPrice - referralAmount;

    // 2. Create Order
    const [newOrder] = await db.insert(order).values({
      userId,
      productId,
      quantity,
      totalPrice: totalPrice.toFixed(2),
      totalAmount: totalPrice.toFixed(2),
      netAmount: netAmount.toFixed(2),
      referralAmount: referralAmount.toFixed(2),
      referrerId: referrerId,
      status: "completed",
      data: { isTest: true, createdAt: new Date().toISOString() },
    }).returning();

    // 3. Create Commission Record if applicable
    if (referrerId && referralAmount > 0) {
      await db.insert(affiliateCommissions).values({
        orderId: newOrder.id,
        affiliateId: referrerId,
        amount: referralAmount.toFixed(2),
        rate: commissionRate.toFixed(2),
        status: "pending",
      });
    }

    return NextResponse.json({
      success: true,
      message: "Test order and commission created",
      order: newOrder,
      commissionGenerated: referralAmount > 0,
      commissionAmount: referralAmount
    });

  } catch (error: any) {
    console.error("[TEST ORDER API ERROR]", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}