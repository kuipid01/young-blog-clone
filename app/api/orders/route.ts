// POST /api/orders (Create Order with Poor Man's Rollback and Log Assignment)

// Assumed Imports
import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "../../../lib/db";
import { logs, order, product, wallets } from "../../../lib/schema";

// Mock function for sending mail
async function sendMailToAdmin(order: any) {
  console.log(`[MAIL] Sent notification for order ${order.id}`);
  // return Promise.resolve();
}

export async function POST(req: Request) {
  let orderId: string | null = null;
  let initialBalance: number = 0;
  let logToUseId: string | null = null; // Variable to store the ID of the selected log
  let outerWalletData:
    | undefined
    | {
        userId: string;
        createdAt: Date;
        firstName: string | null;
        lastName: string | null;
        phoneNumber: string | null;
        address: string | null;
        city: string | null;
        state: string | null;
        country: string | null;
        zipCode: string | null;
        accountName: string | null;
        accountNumber: string | null;
        walletBalance: string;
        updatedAt: Date;
      };
  const { userId, productId, quantity = 1 } = await req.json();
  try {
    if (!userId || !productId || quantity <= 0) {
      return NextResponse.json(
        { message: "Missing userId, productId, or invalid quantity." },
        { status: 400 }
      );
    }

    // --- STEP 1: Fetch Required Data (Product, Wallet, and UNUSED Log) ---
    // IMPORTANT: Fetch only ONE unused log available for the product
    const [productData, walletData, unusedLogData] = await Promise.all([
      db.query.product.findFirst({ where: eq(product.id, productId) }),
      db.query.wallets.findFirst({ where: eq(wallets.userId, userId) }),
      // Fetch only ONE unused log, ordered by creation time (FIFO)
      db.query.logs.findFirst({
        where: (logs, { eq, and }) =>
          and(eq(logs.productId, productId), eq(logs.status, "unused")),
        orderBy: (logs, { asc }) => [asc(logs.createdAt)],
      }),
    ]);

    if (!productData) {
      return NextResponse.json(
        { message: "Product not found." },
        { status: 404 }
      );
    }
    if (!walletData) {
      return NextResponse.json(
        { message: "User wallet not found." },
        { status: 404 }
      );
    }
    outerWalletData = walletData;
    // 🛑 NEW VALIDATION: Check for available UNUSED log
    if (!unusedLogData) {
      return NextResponse.json(
        { message: "No available unused logs for this product." },
        { status: 400 }
      );
    }

    // Store the Log ID for use and rollback
    logToUseId = unusedLogData.id;

    const price = parseFloat(productData.price);
    const stock = parseInt(productData.stock);
    initialBalance = parseFloat(walletData.walletBalance);
    const totalPrice = price * quantity;

    // --- STEP 2: Validation (Same as before) ---
    if (stock < quantity) {
      return NextResponse.json(
        { message: "Insufficient stock." },
        { status: 400 }
      );
    }
    if (initialBalance < totalPrice) {
      return NextResponse.json(
        { message: "Insufficient wallet balance." },
        { status: 400 }
      );
    }

    // --- STEP 3: POOR MAN'S ROLLBACK - Part 1: Tentative Order Creation ---
    // Include the logToUseId in the order creation
    const [newOrderResult] = await db
      .insert(order)
      .values({
        userId,
        productId,
        logId: logToUseId,
        quantity,
        totalPrice: totalPrice.toFixed(2),
        status: "pending_debit",
      })
      .returning({ insertedId: order.id });

    orderId = newOrderResult.insertedId;

    // --- STEP 4: Debit Wallet, Update Stock, and UPDATE LOG STATUS ---
    const newBalance = initialBalance - totalPrice;

    // A. Debit Wallet
    await db
      .update(wallets)
      .set({ walletBalance: newBalance.toFixed(2), updatedAt: sql`now()` })
      .where(eq(wallets.userId, userId));

    // B. Update Log Status to 'used'
    await db
      .update(logs)
      .set({ status: "used" })
      .where(eq(logs.id, logToUseId));

    // C. Update Stock (if enabled)
    const newStockValue = Number(stock) - quantity;
    await db
      .update(product)
      .set({ stock: newStockValue.toLocaleString() })
      .where(eq(product.id, productId));

    // --- STEP 5: FINALIZATION: Complete the Order ---
    const [finalOrder] = await db
      .update(order)
      .set({ status: "completed", updatedAt: sql`now()` })
      .where(eq(order.id, orderId))
      .returning();

    // --- STEP 6: Side Effect ---
    await sendMailToAdmin(finalOrder);

    return NextResponse.json(
      {
        message: "Order created, wallet debited, and log used successfully.",
        order: finalOrder,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Order processing failed:", error.message);

    // --- ROLLBACK LOGIC ---
    if (orderId) {
      console.log(`Attempting rollback for Order ID: ${orderId}`);

      try {
        // 1. Mark Order as 'failed'
        await db
          .update(order)
          .set({ status: "failed", updatedAt: sql`now()` })
          .where(eq(order.id, orderId));

        console.log(`Order ${orderId} marked as FAILED.`);

        // 2. Rollback Wallet Debit (Assuming Step 4 failed AFTER the debit)
        // Since we don't know exactly where the error occurred in Step 4,
        // the safest "Poor Man's" approach is to try to refund the wallet.
        // In a real system, you'd check if the wallet debit transaction completed.

        const refundAmount =
          initialBalance - parseFloat(outerWalletData?.walletBalance || "0");
        if (refundAmount > 0) {
          // If the balance was actually reduced (i.e., debit was successful)
          const refundedBalance = initialBalance; // Restore to the initial balance

          await db
            .update(wallets)
            .set({
              walletBalance: refundedBalance.toFixed(2),
              updatedAt: sql`now()`,
            })
            .where(eq(wallets.userId, userId));

          console.log(`Wallet refunded $${refundAmount.toFixed(2)}.`);
        }

        // 3. Rollback Log Status (If the log was marked as 'used' before failure)
        if (logToUseId) {
          await db
            .update(logs)
            .set({ status: "unused"}) 
            .where(eq(logs.id, logToUseId));

          console.log(`Log ${logToUseId} reset to UNUSED.`);
        }
      } catch (rollbackError) {
        console.error(
          `CRITICAL: Failed to complete full rollback for order ${orderId}. Manual intervention required.`,
          rollbackError
        );
        // Alert monitoring systems here
      }
    }

    return NextResponse.json(
      {
        message:
          "Order creation failed due to a server error. Check your wallet balance and log status for recovery.",
      },
      { status: 500 }
    );
  }
}
