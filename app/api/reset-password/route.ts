import { eq, and, gt } from "drizzle-orm";
import { db } from "../../../lib/db";
import { user, passwordResetTokens } from "../../../lib/schema";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { token, newPassword } = await request.json();

    if (!token || !newPassword) {
      return NextResponse.json({ success: false, message: "Token and new password are required" }, { status: 400 });
    }

    // 1. Find the token and check if valid/unexpired/unused
    const [tokenRecord] = await db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.token, token),
          eq(passwordResetTokens.used, false),
          gt(passwordResetTokens.expiresAt, new Date())
        )
      )
      .limit(1);

    if (!tokenRecord) {
      return NextResponse.json({ success: false, message: "Invalid or expired reset token" }, { status: 400 });
    }

    // 2. Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 3. Update the user password
    await db.update(user)
      .set({ password: hashedPassword })
      .where(eq(user.id, tokenRecord.userId));

    // 4. Mark token as used
    await db.update(passwordResetTokens)
      .set({ used: true })
      .where(eq(passwordResetTokens.id, tokenRecord.id));

    return NextResponse.json({ success: true, message: "Password updated successfully. You can now login." });
  } catch (error) {
    console.error("Reset Password Error:", error);
    return NextResponse.json({ success: false, message: "An unexpected error occurred" }, { status: 500 });
  }
}
