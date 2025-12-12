// app/api/funding/route.ts

import { NextRequest, NextResponse } from "next/server";

/**
 * Interface for the expected request body payload to generate a funding link/account.
 */
interface FundingRequestPayload {
  userId: string; // Your system's identifier for the user
  email: string; // User's email (required by Paystack)
  amount: number; // The amount the user intends to fund (in kobo/cents)
}

/**
 * Interface for the Paystack Initialize Transaction Response
 * (The specific response structure may vary, check Paystack documentation for accuracy)
 */
interface PaystackInitResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url?: string;
    access_code?: string;
    reference: string;
    // If it generates a temporary account:
    account_number?: string;
    bank_name?: string;
    bank_code?: string;
  };
}

/**
 * Handle POST requests to /api/funding
 * This generates a temporary account or link for the user to fund their wallet.
 */
export async function POST(request: NextRequest) {
  let requestData: FundingRequestPayload;

  try {
    requestData = (await request.json()) as FundingRequestPayload;

    if (!requestData.userId || !requestData.email || !requestData.amount) {
      return NextResponse.json(
        { error: "Missing userId, email, or amount in the request body." },
        { status: 400 }
      );
    }
  } catch (e) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

  if (!SECRET_KEY) {
    return NextResponse.json(
      { error: "Server configuration error: Paystack secret key is missing." },
      { status: 500 }
    );
  }

  // Paystack Initialize Transaction endpoint URL
  const url = "https://api.paystack.co/transaction/initialize";
  const FRONTEND_BASE_URL =
    process.env.NEXT_PUBLIC_FRONTEND_URL || "https://jemilmarketplace.com/";
  const SUCCESS_PAGE_PATH = "/dashboard"; // A page designed to handle the redirect
  // Payload for the Paystack API call
  const paystackPayload = {
    email: requestData.email,
    amount: requestData.amount, // Amount in kobo/cents
    channels: ["bank_transfer"], // Ensure bank transfer is enabled
    callback_url: `${FRONTEND_BASE_URL}${SUCCESS_PAGE_PATH}`,

    metadata: {
      user_id: requestData.userId,
    },
    // You may need to add specific parameters here if using a dedicated 'one-time account' service
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(paystackPayload),
      cache: "no-store",
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Paystack API Error:", errorData);

      return NextResponse.json(errorData, { status: response.status });
    }

    const data: PaystackInitResponse = await response.json();

    // The structure returned here will depend on Paystack's exact flow for bank transfers.
    // It might return a redirect URL or a temporary account number directly.
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Funding initiation failed:", error);
    return NextResponse.json(
      { error: "Failed to initiate funding transaction with Paystack." },
      { status: 500 }
    );
  }
}
