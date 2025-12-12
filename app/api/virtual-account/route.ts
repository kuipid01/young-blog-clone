import { NextResponse } from "next/server";
import { db } from "../../../lib/db";
// Assuming your Drizzle schema uses a specific naming convention for tables
import { user, wallets } from "../../../lib/schema";
import { eq } from "drizzle-orm";

// Define the shape of the request body for type safety
interface RequestBody {
  email: string;
  tx_ref: string;
  phonenumber?: string; // Assuming these are optional in the DB/request
  firstname: string;
  lastname?: string;
  narration?: string;
  bvn?: string;
}

// Define the handler function for POST requests
export async function POST(request: Request) {
  // 1. Get Secret Key from Environment Variables
  const SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY;
  if (!SECRET_KEY) {
    return NextResponse.json(
      {
        message: "Server configuration error: Flutterwave secret key not set.",
      },
      { status: 500 }
    );
  }

  let body: RequestBody;

  try {
    // Parse the request body once
    body = (await request.json()) as RequestBody;
  } catch (error) {
    // Handle malformed JSON body
    return NextResponse.json(
      { message: "Invalid JSON format in request body." },
      { status: 400 }
    );
  }

  const { email, tx_ref, phonenumber, firstname, lastname, bvn } = body;

  // 2. Simple validation (placed early)
  if (!email || !tx_ref || !firstname) {
    return NextResponse.json(
      { message: "Missing required fields: email, tx_ref, or firstname." },
      { status: 400 }
    );
  }

  try {
    // 3. Check if user exists (Drizzle returns an array)
    const users = await db
      .select({ id: user.id }) // Select only the necessary user ID
      .from(user)
      .where(eq(user.email, email));

    // 🚨 FIX 1: Drizzle returns an array. Check length for existence.
    if (users.length === 0) {
      return NextResponse.json(
        // Use NextResponse.json for consistency
        { success: false, message: "User does not exist with this email." },
        { status: 404 } // Use 404 for resource not found
      );
    }

    const userId = users[0].id;

    // 4. Check if a wallet already exists for this user
    const userWallets = await db
      .select()
      .from(wallets)
      .where(eq(wallets.userId, userId));

    // 🚨 FIX 2 (LOGIC): Prevent duplicate virtual account creation
    // If a wallet already exists AND has an account number, stop and return the existing details.
    if (userWallets.length > 0 && userWallets[0].accountNumber) {
      return NextResponse.json(
        {
          message: "User already has a virtual account.",
          account_number: userWallets[0].accountNumber,
          bank_name: userWallets[0].bankName,
        },
        { status: 200 }
      );
    }

    // 5. Construct the API payload
    const payload = {
      email,
      tx_ref,
      phonenumber,
      firstname,
      lastname,
      bvn,
      is_permanent: true,
    };

    // 6. Send Request to Flutterwave API
    const response = await fetch(
      "https://api.flutterwave.com/v3/virtual-account-numbers",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        cache: "no-store",
      }
    );

    const data = await response.json();

    // 7. Handle Flutterwave Response
    if (response.ok && data.status === "success") {
      const { account_number, bank_name, flw_ref } = data.data;

      // 🚨 FIX 3 (DB Logic): Update the existing wallet entry or insert a new one
      if (userWallets.length > 0) {
        // UPDATE existing wallet entry
        await db
          .update(wallets)
          .set({
            accountNumber: account_number,
            bankName: bank_name,
            flwRef: flw_ref,
            phoneNumber: phonenumber,
          })
          .where(eq(wallets.userId, userId));
      } else {
        // INSERT new wallet entry (assuming the wallet wasn't created on user sign up)
        await db.insert(wallets).values({
          userId: userId,
          accountNumber: account_number,
          bankName: bank_name,
          flwRef: flw_ref,
          walletBalance: "0",
          phoneNumber: phonenumber,
        });
      }

      return NextResponse.json(
        {
          message: "Virtual account created and linked successfully.",
          account_number: account_number,
          bank_name: bank_name,
        },
        { status: 201 } // Use 201 Created for resource creation
      );
    } else {
      // ERROR: Flutterwave returned an error
      console.error("Flutterwave API Error:", data);
      return NextResponse.json(
        {
          message: "Failed to create virtual account with provider.",
          error: data.message || "Unknown API error",
        },
        { status: 400 }
      );
    }
  } catch (error) {
    // CATCH ALL: Handle DB errors or Fetch/Network errors
    console.error("Critical Server Error:", error);
    return NextResponse.json(
      {
        message:
          "Internal Server Error during processing or database operation.",
      },
      { status: 500 }
    );
  }
}
