import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "../../../../lib/db";
import { order } from "../../../../lib/schema";

interface FaultyItem {
  logContent: string;
  proofUrl: string;
}

export async function POST(req: Request) {
  try {
    const {
      userId,
      orderId,
      reason,
      faultyItems,
    }: {
      userId: string;
      orderId: string;
      reason: string;
      faultyItems: FaultyItem[];
    } = await req.json();

    // --- Validation ---
    if (!userId || !orderId || !reason) {
      return NextResponse.json(
        { message: "Missing required fields." },
        { status: 400 }
      );
    }

    if (!faultyItems || !Array.isArray(faultyItems) || faultyItems.length === 0) {
      return NextResponse.json(
        { message: "Please provide at least one faulty log item." },
        { status: 400 }
      );
    }

    const hasEmptyLog = faultyItems.some(
      (item) => !item.logContent || item.logContent.trim() === ""
    );
    if (hasEmptyLog) {
      return NextResponse.json(
        { message: "Each faulty log must have its content pasted in." },
        { status: 400 }
      );
    }

    // --- Fetch & verify order ---
    const existingOrder = await db.query.order.findFirst({
      where: and(eq(order.id, orderId), eq(order.userId, userId)),
    });

    if (!existingOrder) {
      return NextResponse.json(
        { message: "Order not found or unauthorized." },
        { status: 404 }
      );
    }

    if (existingOrder.status !== "completed") {
      return NextResponse.json(
        { message: "Only completed orders can be refunded." },
        { status: 400 }
      );
    }

    const faultyCount = faultyItems.length;
    const totalQuantity = existingOrder.quantity;

    if (faultyCount > totalQuantity) {
      return NextResponse.json(
        {
          message: `You cannot report more faulty logs (${faultyCount}) than the order quantity (${totalQuantity}).`,
        },
        { status: 400 }
      );
    }

    // --- Calculate partial refund amount ---
    // Proportional: (faulty / total) × totalPrice
    const totalPrice = parseFloat(existingOrder.totalPrice as string);
    const refundAmount = (faultyCount / totalQuantity) * totalPrice;

    // --- Persist ---
    await db
      .update(order)
      .set({
        status: "refund_pending",
        refundReason: reason,
        refundItems: faultyItems,
        refundFaultyCount: faultyCount,
        refundAmount: refundAmount.toFixed(2),
        updatedAt: new Date(),
      })
      .where(eq(order.id, orderId));

    return NextResponse.json(
      {
        message: "Refund request submitted successfully.",
        refundAmount: refundAmount.toFixed(2),
        faultyCount,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Refund request failed:", error);
    return NextResponse.json(
      { message: "Internal server error." },
      { status: 500 }
    );
  }
}
