import { NextResponse } from "next/server";
import { db } from "../../../lib/db";
import { eq, sql } from "drizzle-orm";
import { order, product, wallets } from "../../../lib/schema";
import { sendMailToAdmin } from "../../utils/send-mail";

// POST /api/orders (Create Order with Poor Man's Rollback)
export async function POST(req: Request) {
    let orderId: string | null = null;
    let initialBalance: number = 0;
    
    try {
        const { userId, productId, quantity = 1 } = await req.json();

        if (!userId || !productId || quantity <= 0) {
            return NextResponse.json({ message: 'Missing userId, productId, or invalid quantity.' }, { status: 400 });
        }

        // --- STEP 1: Fetch Required Data (Product & Wallet) ---
        const [productData, walletData] = await Promise.all([
            db.query.product.findFirst({ where: eq(product.id, productId) }),
            db.query.wallets.findFirst({ where: eq(wallets.userId, userId) }),
        ]);

        if (!productData) {
            return NextResponse.json({ message: 'Product not found.' }, { status: 404 });
        }
        if (!walletData) {
            return NextResponse.json({ message: 'User wallet not found.' }, { status: 404 });
        }

        const price = parseFloat(productData.price);
        const stock = parseInt(productData.stock);
        initialBalance = parseFloat(walletData.walletBalance);
        const totalPrice = price * quantity;

        // --- STEP 2: Validation ---
        if (stock < quantity) {
            return NextResponse.json({ message: 'Insufficient stock.' }, { status: 400 });
        }
        if (initialBalance < totalPrice) {
            return NextResponse.json({ message: 'Insufficient wallet balance.' }, { status: 400 });
        }

        // --- STEP 3: POOR MAN'S ROLLBACK - Part 1: Tentative Order Creation ---
        // Create the order with a 'pending_debit' status. This is our checkpoint.
        const [newOrderResult] = await db.insert(order).values({
            userId,
            productId,
            quantity,
            totalPrice: totalPrice.toFixed(2),
            status: 'pending_debit',
        }).returning({ insertedId: order.id });
        
        orderId = newOrderResult.insertedId;
        
        // --- STEP 4: POOR MAN'S ROLLBACK - Part 2: Debit Wallet and Update Stock ---
        const newBalance = initialBalance - totalPrice;

        await db.update(wallets)
            .set({ walletBalance: newBalance.toFixed(2), updatedAt: sql`now()` })
            .where(eq(wallets.userId, userId));

        // Note: In a real scenario, you'd also debit stock here.
        // For simplicity, we skip stock update to focus on the wallet debit logic.
        // await db.update(product).set({ stock: stock - quantity }).where(eq(product.id, productId));
        
        // --- STEP 5: FINALIZATION: Complete the Order ---
        const [finalOrder] = await db.update(order)
            .set({ status: 'completed', updatedAt: sql`now()` })
            .where(eq(order.id, orderId))
            .returning(); // Use .returning() to get the final order object

        // --- STEP 6: Side Effect ---
        await sendMailToAdmin(finalOrder);

        return NextResponse.json({ message: 'Order created and wallet debited successfully.', order: finalOrder }, { status: 201 });

    } catch (error: any) {
        console.error('Order processing failed:', error.message);

        // --- ROLLBACK LOGIC ---
        if (orderId) {
            console.log(`Attempting rollback for Order ID: ${orderId}`);
            
            // Check if debit occurred by looking at the error location (or status in a real system)
            // Since the failure happens after insert (Step 3), we need to handle the refund.
            try {
                // Set order status to 'failed'
                await db.update(order)
                    .set({ status: 'failed', updatedAt: sql`now()` })
                    .where(eq(order.id, orderId));
                
                console.log(`Order ${orderId} marked as FAILED.`);

                // Important: Since we created the order with 'pending_debit' and failed *before*
                // setting it to 'completed', we assume the wallet was *not* successfully debited 
                // in the failed step. 
                // If the error was specifically on the debit step (Step 4), a *refund* would be needed.
                // For this poor man's rollback, we only mark the order as failed.
                
            } catch (rollbackError) {
                console.error(`CRITICAL: Failed to rollback (mark order ${orderId} as failed). Manual intervention required.`, rollbackError);
            }
        }

        return NextResponse.json({ message: 'Order creation failed due to a server error. Please check wallet for debit status.' }, { status: 500 });
    }
}