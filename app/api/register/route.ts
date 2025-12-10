import { NextResponse } from "next/server";
import { eq, or } from "drizzle-orm";
import { db } from "../../../lib/db";
import { referrals, user, wallets } from "../../../lib/schema"; // Added 'wallets' schema import
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  let newUserId: string | null = null; // Variable to hold the user ID for rollback purposes

  try {
    const body = await request.json();
    const { username, email, password, referralCode: incomingCode } = body;

    // Check if user already exists
    const userExists = await db
      .select()
      .from(user)
      .where(or(eq(user.email, email), eq(user.username, username)));

    if (userExists.length > 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "User already exists with mail or username",
        }),
        { status: 400 }
      );
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10); // 10 is the salt rounds
    const generatedCode = `${username}-${Math.random()
      .toString(36)
      .substring(2, 8)}`;
    // 1. Insert new user and use .returning() to get the generated ID
    const [newUser] = await db
      .insert(user)
      .values({
        username,
        email:email.toLowerCase(),
        password: hashedPassword,
        referralCode: generatedCode.trim().toLowerCase(),
      })
      .returning({ id: user.id });

    if (!newUser || !newUser.id) {
      // If we fail here, the outer catch block handles the 500 response.
      throw new Error("User creation failed to return ID.");
    }

    newUserId = newUser.id; // User successfully created.

    // 2. Create a new wallet entry for the registered user
    // If this fails, the catch block will delete the user record (rollback).
    await db.insert(wallets).values({
      userId: newUserId,
      walletBalance: "0.00", // Defaulting the balance to 0.00
    });

    // If referral code exists, link referral
    if (incomingCode) {
      const [referrer] = await db
        .select()
        .from(user)
        .where(eq(user.referralCode, incomingCode))
        .limit(1);

      if (referrer) {
        await db.insert(referrals).values({
          referredUserId: newUserId,
          referrerUserId: referrer.id,
        });
      }
    }

    // Success response
    return new Response(
      JSON.stringify({
        success: true,
        userId: newUserId,
        message: "User and wallet created successfully.",
      }),
      {
        status: 201,
      }
    );
  } catch (err) {
    console.error("Registration Error:", err);

    // --- POOR MAN'S ROLLBACK LOGIC ---
    // If newUserId exists, it means the user record was created, but a subsequent step failed.
    if (newUserId) {
      console.log(`Attempting rollback: Deleting incomplete user ${newUserId}`);
      try {
        // Delete the partially created user record
        await db.delete(user).where(eq(user.id, newUserId));
        console.log(`Rollback successful: User ${newUserId} deleted.`);
      } catch (cleanupError) {
        // Log cleanup failure, but still return 500 to the client
        console.error(
          `CRITICAL: Failed to clean up user ${newUserId} after registration failure. DB may be inconsistent.`,
          cleanupError
        );
      }
    }

    // Return server error response
    return new Response(
      JSON.stringify({
        success: false,
        message: "Server error: Failed to complete registration.",
      }),
      { status: 500 }
    );
  }
}
