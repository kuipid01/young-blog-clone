import { eq, or } from "drizzle-orm";
import { db } from "../../../lib/db";
import { user, passwordResetTokens } from "../../../lib/schema";
import { brevo } from "../../../lib/brevo";
import crypto from "crypto";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ success: false, message: "Email is required" }, { status: 400 });
    }

    // 1. Find the user
    const [foundUser] = await db
      .select()
      .from(user)
      .where(eq(user.email, email.toLowerCase()));

    if (!foundUser) {
      // For security reasons, don't reveal if user exists or not
      // But usually in internal apps, it's fine. 
      // I'll return success anyway to prevent email enumeration, but let's be helpful for now.
      return NextResponse.json({ success: false, message: "User with this email not found" }, { status: 404 });
    }

    // 2. Generate a token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiry

    // 3. Store the token
    await db.insert(passwordResetTokens).values({
      userId: foundUser.id,
      token,
      expiresAt,
    });

    // 4. Send the email
    const emailResult = await brevo.sendPasswordResetEmail(foundUser.email!, token, foundUser.username || "User");

    if (!emailResult.success) {
      return NextResponse.json({ success: false, message: "Failed to send reset email" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Password reset instructions sent to your email" });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    return NextResponse.json({ success: false, message: "An unexpected error occurred" }, { status: 500 });
  }
}
