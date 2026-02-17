import { NextRequest, NextResponse } from "next/server";
import * as crypto from "crypto";
import { db } from "@/lib/db";
import { payments, wallets, withdrawals, withdrawalMetadata, affiliates } from "@/lib/schema";
import { eq, sql } from "drizzle-orm";

const KORAPAY_SECRET_KEY = process.env.KORAPAY_SECRET_KEY;

export async function POST(req: NextRequest) {
    const requestId = crypto.randomUUID(); // trace one webhook end-to-end

    try {
        console.info(`[KORA][${requestId}] Webhook received`);

        if (!KORAPAY_SECRET_KEY) {
            console.error(
                `[KORA][${requestId}] ❌ KORAPAY_SECRET_KEY is not set`
            );
            return new NextResponse("Server Error", { status: 500 });
        }

        const rawBody = await req.text();
        const signature = req.headers.get("x-korapay-signature");

        console.debug(
            `[KORA][${requestId}] Raw body length: ${rawBody.length}`
        );

        if (!signature) {
            console.warn(
                `[KORA][${requestId}] ❌ Missing x-korapay-signature header`
            );
            return new NextResponse("Missing signature", { status: 401 });
        }

        let payload: any;
        try {
            payload = JSON.parse(rawBody);
        } catch (err) {
            console.error(
                `[KORA][${requestId}] ❌ Failed to parse JSON body`,
                err
            );
            return new NextResponse("Invalid JSON", { status: 400 });
        }

        const { event, data } = payload;

        console.info(
            `[KORA][${requestId}] Event received: ${event}, Reference: ${data?.reference}`
        );

        // ---- Signature verification ----
        const dataString = JSON.stringify(data);
        const computedHash = crypto
            .createHmac("sha256", KORAPAY_SECRET_KEY)
            .update(dataString)
            .digest("hex");

        if (computedHash !== signature) {
            console.warn(
                `[KORA][${requestId}] ⚠️ Signature mismatch`,
                {
                    computedHash,
                    signature,
                    reference: data?.reference,
                }
            );

            // Optional: reject instead of warn
            // return new NextResponse("Invalid signature", { status: 401 });
        } else {
            console.info(
                `[KORA][${requestId}] ✅ Signature verified`
            );
        }

        // ---- Handle successful charge ----
        if (event === "charge.success") {
            const { reference, amount, currency, status, payment_reference } = data;

            console.info(
                `[KORA][${requestId}] charge.success received`,
                {
                    reference,
                    amount,
                    currency,
                    status,
                    payment_reference,
                }
            );

            if (!payment_reference) {
                console.error(
                    `[KORA][${requestId}] ❌ Missing payment_reference in metadata`,
                    { payment_reference }
                );
                return new NextResponse("Missing payment_reference", { status: 400 });
            }

            const payment = await db
                .select()
                .from(payments)
                .where(eq(payments.paymentReference, payment_reference));

            if (!payment.length) {
                console.error(
                    `[KORA][${requestId}] ❌ No payment found for reference`,
                    { payment_reference }
                );
                return new NextResponse("Payment not found", { status: 404 });
            }

            if (status === "success") {
                console.info(
                    `[KORA][${requestId}] Processing wallet credit`,
                    { userId: payment[0].userId, amount }
                );

                await db.transaction(async (tx) => {
                    // 1️⃣ Update wallet balance
                    await tx
                        .update(wallets)
                        .set({
                            walletBalance: sql`${wallets.walletBalance} + ${amount}`,
                            updatedAt: new Date(),
                        })
                        .where(eq(wallets.userId, payment[0].userId));

                    console.debug(`[KORA][${requestId}] Wallet updated`, { userId: payment[0].userId });

                    // 2️⃣ Update existing payment
                    await tx
                        .update(payments)
                        .set({
                            status: "funded",
                            proof: `Kora Ref: ${reference}`,
                            amount: Number(amount).toFixed(2),

                        })
                        .where(eq(payments.paymentReference, payment_reference));

                    console.debug(`[KORA][${requestId}] Payment record updated`, { paymentReference: payment_reference });
                });


                console.info(
                    `[KORA][${requestId}] ✅ Wallet credited successfully`,
                    {
                        userId: payment[0].userId,
                        amount,
                        currency,
                    }
                );
            } else {
                console.warn(
                    `[KORA][${requestId}] ⚠️ charge.success event but status != success`,
                    { status }
                );
            }
        } else if (event === "transfer.success") {
            const { reference, amount, status } = data;
            console.info(`[KORA][${requestId}] transfer.success received`, { reference, amount, status });

            const meta = await db.query.withdrawalMetadata.findFirst({
                where: eq(withdrawalMetadata.reference, reference),
            });

            if (!meta) {
                console.warn(`[KORA][${requestId}] ⚠️ No withdrawal metadata found for reference ${reference}`);
            } else {
                await db.update(withdrawals)
                    .set({ status: "approved" })
                    .where(eq(withdrawals.id, meta.withdrawalId));
                
                 await db.update(withdrawalMetadata)
                    .set({ status: status, metadata: data })
                    .where(eq(withdrawalMetadata.reference, reference));
                
                console.info(`[KORA][${requestId}] ✅ Withdrawal confirmed`);
            }

        } else if (event === "transfer.failed") {
            const { reference, amount, status } = data;
             console.info(`[KORA][${requestId}] transfer.failed received`, { reference, amount, status });

            const meta = await db.query.withdrawalMetadata.findFirst({
                where: eq(withdrawalMetadata.reference, reference),
                with: {
                    withdrawal: true
                }
            });
            
             if (!meta) {
                console.warn(`[KORA][${requestId}] ⚠️ No withdrawal metadata found for reference ${reference}`);
            } else {
                 await db.transaction(async (tx) => {
                    // 1. Update withdrawal status to rejected
                    await tx.update(withdrawals)
                        .set({ status: "rejected" })
                        .where(eq(withdrawals.id, meta.withdrawalId));

                    // 2. Refund affiliate balance
                    // We need to fetch the specific withdrawal to know the exact amount requested (which might differ from 'amount' in webhook if fees involved, but usually amount matches)
                    // For safety, let's use the amount from the withdrawal record if possible, or the one from webhook. 
                    // However, we deducted 'amount' in the withdrawal route. The webhook 'amount' should be the same.
                    // Let's rely on the metadata's withdrawal info if available.
                    
                    const refundAmount = meta.withdrawal ? meta.withdrawal.amount : amount;

                    await tx.update(affiliates)
                        .set({ currentBalance: sql`${affiliates.currentBalance} + ${refundAmount}` })
                        .where(eq(affiliates.id, meta.withdrawal!.affiliateId));
                    
                    // 3. Update metadata
                    await tx.update(withdrawalMetadata)
                        .set({ status: status, metadata: data })
                        .where(eq(withdrawalMetadata.reference, reference));
                 });

                 console.info(`[KORA][${requestId}] ❌ Withdrawal failed. Balance refunded.`);
            }

        } else {
            console.info(
                `[KORA][${requestId}] Ignored event type: ${event}`
            );
        }

        return new NextResponse("OK", { status: 200 });
    } catch (error) {
        console.error(
            `[KORA][${requestId}] ❌ Unhandled webhook error`,
            error
        );
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
