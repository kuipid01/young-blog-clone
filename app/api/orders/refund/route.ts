
import { NextResponse } from "next/server";
import { eq, and, sql } from "drizzle-orm";
import { db } from "../../../../lib/db";
import { order, savedBankDetails } from "../../../../lib/schema";

export async function POST(req: Request) {
    try {
        const {
            userId,
            orderId,
            reason,
            proof,
            bankName,
            accountNumber,
            accountName,
            bankCode,
            saveBankDetails: shouldSaveBankDetails
        } = await req.json();

        if (!userId || !orderId || !reason) {
            return NextResponse.json(
                { message: "Missing required fields." },
                { status: 400 }
            );
        }

        // Validate bank details if provided (basic check)
        if (bankName && (!accountNumber || !accountName)) {
            return NextResponse.json(
                { message: "Incomplete bank details." },
                { status: 400 }
            );
        }

        // Verify order exists and belongs to user
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

        // Save bank details if requested
        if (shouldSaveBankDetails && bankName && accountNumber && accountName && bankCode) {
            // Check if already exists to avoid duplicates (optional, based on account number)
            const existingBank = await db.query.savedBankDetails.findFirst({
                where: and(
                    eq(savedBankDetails.userId, userId),
                    eq(savedBankDetails.accountNumber, accountNumber)
                )
            });

            if (!existingBank) {
                await db.insert(savedBankDetails).values({
                    userId,
                    bankName,
                    bankCode,
                    accountNumber,
                    accountName,
                });
            }
        }

        // Update order status and refund details
        await db
            .update(order)
            .set({
                status: "refund_pending",
                refundReason: reason,
                refundProof: proof,
                refundBankName: bankName,
                refundAccountNumber: accountNumber,
                refundAccountName: accountName,
                updatedAt: new Date(),
            })
            .where(eq(order.id, orderId));

        return NextResponse.json(
            { message: "Refund request submitted successfully." },
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
