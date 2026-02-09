// POST /api/orders (Improved: Internal & External Handling with Poor Man's Rollback)

import { NextResponse } from "next/server";
import { eq, sql, and } from "drizzle-orm";
import { db } from "../../../lib/db";
import { logs, order, product, wallets, referrals, affiliateCommissions } from "../../../lib/schema";

// Mock function for sending mail
async function sendMailToAdmin(order: any) {
  console.log(`[MAIL] Sent notification for order ${order.id}`);
}

export async function POST(req: Request) {
  let orderId: string | null = null;
  let initialBalance: number = 0;
  let logToUseId: string | null = null;
  let outerWalletData: any = null;

  const {
    userId,
    productId,
    quantity = 1,
    status,
    trans_id,
    data,
    price,
    stock,
    source = "external", // 'internal' or 'external'
  } = await req.json();

  console.log(`[ORDER] Starting order processing for User: ${userId}, Product: ${productId}, Quantity: ${quantity}, Source: ${source}`);

  try {
    if (!userId || !productId || quantity <= 0) {
      console.log(`[VALIDATION ERROR] Missing or invalid parameters - userId: ${userId}, productId: ${productId}, quantity: ${quantity}`);
      return NextResponse.json(
        { message: "Missing userId, productId, or invalid quantity." },
        { status: 400 }
      );
    }

    // --- STEP 1: Fetch wallet & logs (if internal) ---
    console.log(`[STEP 1] Fetching wallet data for User: ${userId}`);
    const walletData = await db.query.wallets.findFirst({
      where: eq(wallets.userId, userId),
    });

    if (!walletData) {
      console.log(`[STEP 1 ERROR] Wallet not found for User: ${userId}`);
      return NextResponse.json(
        { message: "User wallet not found." },
        { status: 404 }
      );
    }
    outerWalletData = walletData;
    initialBalance = parseFloat(walletData.walletBalance);
    const totalPrice = price * quantity;

    console.log(`[STEP 1 SUCCESS] Wallet found - Balance: ${initialBalance}, Total Price: ${totalPrice}`);

    // --- STEP 1.5: Check for Referrer (Affiliate) ---
    console.log(`[STEP 1.5] Checking for referrer for User: ${userId}`);
    const referral = await db.query.referrals.findFirst({
      where: eq(referrals.referredUserId, userId),
    });

    let currentReferrerId = null;
    let currentReferralAmount = 0;
    const commissionRate = 10; // 10% for orders as requested

    if (referral) {
      currentReferrerId = referral.referrerUserId;
      currentReferralAmount = totalPrice * (commissionRate / 100);
      console.log(`[STEP 1.5] Referrer found: ${currentReferrerId}, Commission: ${currentReferralAmount}`);
    } else {
      console.log(`[STEP 1.5] No referrer found for this user`);
    }

    const currentNetAmount = totalPrice - currentReferralAmount;

    // --- Validation: Stock and Wallet Balance ---
    if (source === "internal" && stock < quantity) {
      console.log(`[VALIDATION ERROR] Insufficient stock - Available: ${stock}, Required: ${quantity}`);
      return NextResponse.json(
        { message: "Insufficient stock." },
        { status: 400 }
      );
    }
    if (initialBalance < totalPrice) {
      console.log(`[VALIDATION ERROR] Insufficient wallet balance - Balance: ${initialBalance}, Required: ${totalPrice}`);
      return NextResponse.json(
        { message: "Insufficient wallet balance." },
        { status: 400 }
      );
    }

    console.log(`[VALIDATION SUCCESS] Stock and wallet balance checks passed`);

    // --- STEP 2: If internal, fetch one unused log ---
    if (source === "internal") {
      console.log(`[STEP 2] Fetching unused log for Product: ${productId}`);
      const unusedLogData = await db.query.logs.findFirst({
        where: (logs, { eq, and }) =>
          and(eq(logs.productId, productId), eq(logs.status, "unused")),
        orderBy: (logs, { asc }) => [asc(logs.createdAt)],
      });

      if (!unusedLogData) {
        console.log(`[STEP 2 ERROR] No unused logs available for Product: ${productId}`);
        return NextResponse.json(
          { message: "No available unused logs for this product." },
          { status: 400 }
        );
      }
      logToUseId = unusedLogData.id;
      console.log(`[STEP 2 SUCCESS] Unused log found - Log ID: ${logToUseId}`);
    } else {
      console.log(`[STEP 2 SKIPPED] External product, no log needed`);
    }

    // --- STEP 3: Tentative Order Creation ---
    console.log(`[STEP 3] Creating tentative order`);
    const [newOrderResult] = await db
      .insert(order)
      .values({
        userId,
        productId,
        logId: logToUseId,
        quantity,
        totalPrice: totalPrice.toFixed(2),
        totalAmount: totalPrice.toFixed(2),
        netAmount: currentNetAmount.toFixed(2),
        referralAmount: currentReferralAmount.toFixed(2),
        referrerId: currentReferrerId,
        status,
        data,
        trans_id,
      })
      .returning({ insertedId: order.id });

    orderId = newOrderResult.insertedId;
    console.log(`[STEP 3 SUCCESS] Order created - Order ID: ${orderId}`);

    // --- STEP 4: Debit Wallet ---
    console.log(`[STEP 4] Debiting wallet - Previous Balance: ${initialBalance}, Amount: ${totalPrice}`);
    const newBalance = initialBalance - totalPrice;
    await db
      .update(wallets)
      .set({ walletBalance: newBalance.toFixed(2), updatedAt: sql`now()` })
      .where(eq(wallets.userId, userId));

    console.log(`[STEP 4 SUCCESS] Wallet debited - New Balance: ${newBalance}`);

    // --- STEP 5: Finalization ---
    console.log(`[STEP 5] Finalizing order`);
    let finalOrder: any;

    if (source === "internal" && !trans_id && logToUseId) {
      console.log(`[STEP 5] Internal product processing - Marking log as used and reducing stock`);
      // Mark log as used
      await db
        .update(logs)
        .set({ status: "used" })
        .where(eq(logs.id, logToUseId));
      console.log(`[STEP 5] Log marked as used - Log ID: ${logToUseId}`);

      // Reduce stock
      const stockNumber = stock - quantity;
      await db
        .update(product)
        .set({ stock: stockNumber.toString() })
        .where(eq(product.id, productId));
      console.log(`[STEP 5] Stock reduced - Previous: ${stock}, New: ${stockNumber}`);

      // Fetch final order with joined log
      [finalOrder] = await db
        .select({
          order: order,
          log: {
            id: logs.id,
            logDetails: logs.logDetails,
            status: logs.status,
          },
        })
        .from(order)
        .leftJoin(logs, eq(order.logId, logs.id))
        .where(eq(order.id, orderId));
      console.log(`[STEP 5] Final order fetched with log details`);
    } else {
      console.log(`[STEP 5] External product processing - No log update needed`);
      // External product: No log update
      [finalOrder] = await db.select().from(order).where(eq(order.id, orderId));
      console.log(`[STEP 5] Final order fetched`);
    }

    // Update order status to completed
    await db
      .update(order)
      .set({ status: "completed", updatedAt: sql`now()` })
      .where(eq(order.id, orderId));
    console.log(`[STEP 5 SUCCESS] Order status updated to completed - Order ID: ${orderId}`);

    // --- STEP 5.5: Create Affiliate Commission Record ---
    if (orderId && currentReferrerId && currentReferralAmount > 0) {
      console.log(`[STEP 5.5] Creating affiliate commission entry for Order: ${orderId}`);
      await db.insert(affiliateCommissions).values({
        orderId,
        affiliateId: currentReferrerId,
        amount: currentReferralAmount.toFixed(2),
        rate: commissionRate.toFixed(2),
        status: "pending",
      });
      console.log(`[STEP 5.5 SUCCESS] Affiliate commission entry created`);
    }

    // --- STEP 6: Side Effects ---
    console.log(`[STEP 6] Sending notification email to admin`);
    await sendMailToAdmin(finalOrder);
    console.log(`[STEP 6 SUCCESS] Admin notification sent`);

    console.log(`[ORDER SUCCESS] Order processed successfully - Order ID: ${orderId}`);
    return NextResponse.json(
      {
        message: "Order processed successfully.",
        order: finalOrder,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error(`[ORDER ERROR] Order processing failed: ${error.message}`);
    console.error(`[ORDER ERROR] Stack trace:`, error.stack);

    // --- ROLLBACK LOGIC ---
    if (orderId) {
      console.log(`[ROLLBACK] Starting rollback for Order ID: ${orderId}`);
      try {
        // 1. Mark Order as 'failed'
        console.log(`[ROLLBACK STEP 1] Marking order as failed`);
        await db
          .update(order)
          .set({ status: "failed", updatedAt: sql`now()` })
          .where(eq(order.id, orderId));
        console.log(`[ROLLBACK STEP 1 SUCCESS] Order marked as failed - Order ID: ${orderId}`);

        // 2. Refund wallet
        console.log(`[ROLLBACK STEP 2] Refunding wallet - Restoring balance to: ${initialBalance}`);
        const refundedBalance = initialBalance;
        await db
          .update(wallets)
          .set({
            walletBalance: refundedBalance.toFixed(2),
            updatedAt: sql`now()`,
          })
          .where(eq(wallets.userId, userId));
        console.log(`[ROLLBACK STEP 2 SUCCESS] Wallet refunded to ${refundedBalance} for User: ${userId}`);

        // 3. Reset log if internal
        if (logToUseId) {
          console.log(`[ROLLBACK STEP 3] Resetting log to unused - Log ID: ${logToUseId}`);
          await db
            .update(logs)
            .set({ status: "unused" })
            .where(eq(logs.id, logToUseId));
          console.log(`[ROLLBACK STEP 3 SUCCESS] Log reset to UNUSED - Log ID: ${logToUseId}`);
        } else {
          console.log(`[ROLLBACK STEP 3 SKIPPED] No log to reset`);
        }

        console.log(`[ROLLBACK SUCCESS] Rollback completed successfully for Order ID: ${orderId}`);
      } catch (rollbackError) {
        console.error(
          `[ROLLBACK CRITICAL ERROR] Failed rollback for Order ID: ${orderId}. Manual intervention needed.`,
          rollbackError
        );
      }
    } else {
      console.log(`[ROLLBACK SKIPPED] No order ID available, rollback not needed`);
    }

    return NextResponse.json(
      {
        message:
          "Order creation failed. Please verify wallet balance and log status.",
      },
      { status: 500 }
    );
  }
}
