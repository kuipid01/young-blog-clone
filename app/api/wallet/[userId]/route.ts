import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { payments, wallets } from "../../../../lib/schema";

// Define the expected path parameters
interface Context {
  params: {
    userId: string;
  };
}

// FIX: Destructure { params } directly from the second argument to correctly access path parameters
// This fixes the "params is a Promise" error by using the standard Next.js App Router signature.
export async function GET(req: NextRequest, ctx: RouteContext<'/api/wallet/[userId]'>) {
  // Access userId directly from the destructured params object
  const { userId } = await ctx.params

  try {
    if (!userId) {
      return NextResponse.json(
        { message: "Missing user ID in path parameters." },
        { status: 400 }
      );
    }

    // Use Drizzle's `eq` to filter by userId
    const userWallet = await db
      .select()
      .from(wallets)
      .where(eq(wallets.userId, userId));

    if (userWallet.length === 0) {
      return NextResponse.json(
        { message: `No wallet found for user ID: ${userId}` },
        { status: 404 }
      );
    }

    return NextResponse.json(userWallet[0], { status: 200 });
  } catch (error) {
    console.error(
      `Error fetching wallet for user ${userId}:`, // Use the locally available userId
      error
    );
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}