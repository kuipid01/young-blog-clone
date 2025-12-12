// app/api/webhooks/paystack/route.ts
export const runtime = "nodejs"; 


import { NextRequest, NextResponse } from "next/server";
import * as crypto from "crypto";
import { db } from "../../../../lib/db";
import { wallets } from "../../../../lib/schema";
import { eq, sql } from "drizzle-orm"; // Import sql and transaction support

// CRITICAL FIX: Use the dedicated Webhook Secret key
const WEBHOOK_SECRET = process.env.PAYSTACK_SECRET_KEY;; 

export async function POST(req: NextRequest) {
    // 1. Initial Checks and Setup
    if (!WEBHOOK_SECRET) {
        console.error("PAYSTACK_WEBHOOK_SECRET is not set. Check environment variables.");
        return new NextResponse("Server Error: Webhook secret not configured.", {
            status: 500,
        });
    }

    // Read the raw body for verification FIRST
    const rawBody = await req.text();

    // 2. Verify the event's authenticity
    const hmac = crypto.createHmac("sha512", WEBHOOK_SECRET);
    hmac.update(rawBody);
    const hash = hmac.digest("hex");
    const signature = req.headers.get("x-paystack-signature");

    if (hash !== signature) {
        console.warn(`Paystack Webhook: Invalid signature. Request rejected. Hash: ${hash}, Signature: ${signature}`);
        return new NextResponse("Invalid signature", { status: 401 });
    }

    // Parse the body as JSON after successful verification
    const event = JSON.parse(rawBody);
    console.log(`Paystack Webhook Received: ${event.event} for reference: ${event.data.reference}`); // LOG 1

    // 3. Process the specific event type
    try {
        switch (event.event) {
            case "charge.success":
                const transactionData = event.data;
                const reference = transactionData.reference;
                const userId = transactionData.metadata?.user_id;

                // Ensure essential data exists
                if (!userId) {
                    console.error(`Webhook Error [${reference}]: Charge success event missing required metadata (user_id).`); // LOG 2
                    // Return 200/400 to stop Paystack retrying a bad event payload
                    return new NextResponse("Missing required data.", { status: 400 }); 
                }

                // Paystack amounts are in kobo/cents. Convert to the main currency (e.g., NGN)
                const amountInCurrency = transactionData.amount / 100;
                
                // --- CRITICAL ATOMIC UPDATE & LOGGING IN TRANSACTION ---
                await db.transaction(async (tx) => {
                    // 3a. Select the wallet to get the current balance
                    const [wallet] = await tx
                        .select({ currentBalance: wallets.walletBalance })
                        .from(wallets)
                        .where(eq(wallets.userId, userId));
                    
                    if (!wallet) {
                        // Throwing an error in a transaction will cause a rollback
                        throw new Error(`No wallet found for userId: ${userId}`); 
                    }

                    const previousBalance = wallet.currentBalance;
                    const expectedNewBalance = Number(previousBalance) + Number(amountInCurrency);
                    
                    // 3b. Update the balance ATOMICALLY
                    await tx
                        .update(wallets)
                        .set({
                            walletBalance: sql`${wallets.walletBalance} + ${amountInCurrency}`,
                            updatedAt: new Date(),
                        })
                        .where(eq(wallets.userId, userId));
                    
                    // Since the update is atomic, the expectedNewBalance calculation 
                    // should be correct, though we can't RETURNING it simultaneously.

                    // LOG 3: Detailed Wallet Update Log
                    console.log(`Wallet Update Success [${reference}]: 
                        - User ID: ${userId}
                        - Credited Amount: ₦${amountInCurrency}
                        - Previous Balance: ₦${previousBalance}
                        - Expected New Balance: ₦${expectedNewBalance}
                        - Status: SUCCESS
                    `);
                }); // The transaction commits here if successful, or rolls back on error

                break;
            case "customer.create":
                console.log("New customer created:", event.data.email);
                break;
            default:
                console.log(`Acknowledged unhandled event type: ${event.event}`);
        }
    } catch (error) {
        // LOG 4: Catch and log any transaction or processing failure
        console.error("FATAL Error processing Paystack webhook event:", error instanceof Error ? error.message : String(error));
    }

    // 4. Always return 200 OK to Paystack to acknowledge receipt and stop retries
    return new NextResponse(null, { status: 200 });
}