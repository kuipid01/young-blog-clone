import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { affiliates, withdrawals, withdrawalMetadata } from "@/lib/schema";
import { eq, sql } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { affiliateId, amount, bankDetails, narration } = body;
    const backendUrl = process.env.WITHDRAWAL_BACKEND_URL || "http://localhost:5000";

    // 1. Basic Validation
    if (!affiliateId || !amount || !bankDetails) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // 2. Fetch Affiliate & Associated User (for email) & Check Balance
    const affiliateData = await db.query.affiliates.findFirst({
      where: eq(affiliates.id, affiliateId),
      with: {
        user: true,
      },
    });

    if (!affiliateData || !affiliateData.user) {
      return new NextResponse("Affiliate or associated user not found", { status: 404 });
    }

    if (Number(affiliateData.currentBalance) < Number(amount)) {
      return new NextResponse("Insufficient balance", { status: 400 });
    }

    // 3. Create initial Withdrawal Record (Pending)
    const withdrawalId = createId();
    await db.insert(withdrawals).values({
      id: withdrawalId,
      affiliateId,
      amount: Number(amount).toFixed(2),
      status: "pending",
      type: "automatic",
      bankName: bankDetails.bank_name,
      accountNumber: bankDetails.account_number,
      accountName: bankDetails.account_name,
    });

    // 4. Call Local Backend (Proxy for KoraPay with fixed IP)
    const reference = `wd_${createId()}`; // Unique reference for this transaction
    const koraPayload = {
      reference,
      destination: {
        type: "bank_account",
        amount: Number(amount),
        currency: "NGN",
        narration: narration || "Payout",
        bank_account: {
          bank: bankDetails.bank_code,
          account: bankDetails.account_number,
        },
        customer: {
            name: bankDetails.account_name,
            email: affiliateData.user.email 
        }
      },
    };

    console.log(koraPayload,"koraPayload")
    
    let koraData: any = null;
    let koraFailed = false;

    try {
      const response = await fetch(`${backendUrl}/api/withdrawals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(koraPayload),
      });
      koraData = await response.json();
      if (!koraData.status) koraFailed = true;
    } catch (error) {
      console.error("Kora API Connection Error:", error);
      koraFailed = true;
    }

    // 5. Handle Failure (Transition to Manual) or Success
    if (koraFailed) {
      // Create Manual Withdrawal Request
      await db.transaction(async (tx) => {
        // Deduct balance
        await tx
            .update(affiliates)
            .set({
                currentBalance: sql`${affiliates.currentBalance} - ${amount}`,
            })
            .where(eq(affiliates.id, affiliateId));
        
        // Update status for manual processing
        await tx
            .update(withdrawals)
            .set({ 
              status: "pending", 
              type: "manual", 
              adminNote: `Automatic failed: ${koraData?.message || "Connection Error"}` 
            }) 
            .where(eq(withdrawals.id, withdrawalId));
      });

      return NextResponse.json({ 
        message: "Automatic payout failed. Request submitted for manual processing.", 
        type: "manual" 
      });
    }

    // 6. Success from API (Processing) - Deduct Balance & Save Metadata
    await db.transaction(async (tx) => {
        // Deduct balance
        await tx
            .update(affiliates)
            .set({
                currentBalance: sql`${affiliates.currentBalance} - ${amount}`,
            })
            .where(eq(affiliates.id, affiliateId));
        
        // Update withdrawal status
        await tx
            .update(withdrawals)
            .set({ status: "processing" }) 
            .where(eq(withdrawals.id, withdrawalId));

        // Save metadata
        await tx.insert(withdrawalMetadata).values({
            withdrawalId,
            reference,
            fee: koraData.data.fee,
            currency: koraData.data.currency,
            status: koraData.data.status,
            metadata: koraData.data,
        });
    });

    return NextResponse.json({ message: "Withdrawal initiated automatically", reference });

  } catch (error) {
    console.error("Error processing withdrawal:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

