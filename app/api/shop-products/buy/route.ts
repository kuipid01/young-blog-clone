// app/api/process_order/route.ts

import { NextResponse } from "next/server";

// Define the external API endpoint
const EXTERNAL_API_URL = "https://shopviaclone22.com/api/buy_product";

/**
 * Handles POST requests to process a product purchase.
 */
export async function POST(request: Request) {
  try {
    // 1. Get the form data from the incoming request
    const formData = await request.formData();

    // 2. Extract and validate required fields (optional, but recommended)
    const action = formData.get("action");
    const id = formData.get("id");
    const amount = formData.get("amount");
    const coupon = formData.get("coupon"); // Optional field

    const API_KEY = process.env.SHOPCLONEAPI || "";
    formData.set("api_key", API_KEY);

    if (!process.env.SHOPCLONEAPI) {
      return NextResponse.json(
        { message: "Server configuration error: Missing API key." },
        { status: 500 }
      );
    }
    if (action !== "buyProduct" || !id || !amount) {
      return NextResponse.json(
        { message: "Missing required fields: action, id, or amount." },
        { status: 400 }
      );
    }

    // 3. Forward the FormData to the external API
    const externalResponse = await fetch(EXTERNAL_API_URL, {
      method: "POST",
      body: formData,
    });

    // 4. Handle non-successful response from the external API
    if (!externalResponse.ok) {
      // Pass the error status and message back to the client
      const errorData = await externalResponse.json();
      return NextResponse.json(
        {
          message: "External API request failed",
          details: errorData,
        },
        { status: externalResponse.status }
      );
    }

    // 5. Return the successful response from the external API to the client
    const successData = await externalResponse.json();
    return NextResponse.json(successData, { status: 200 });
  } catch (error) {
    console.error("Error processing buy request:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
