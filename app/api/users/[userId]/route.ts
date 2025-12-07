import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../lib/db";
import { user } from "../../../../lib/schema";
import { eq } from "drizzle-orm";

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
    const userData = await db
      .select()
      .from(user)
      .where(eq(user.id, userId));

    if (userData.length === 0) {
      return NextResponse.json(
        { message: `No user found for user ID: ${userId}` },
        { status: 404 }
      );
    }

    return NextResponse.json(userData[0], { status: 200 });
  } catch (error) {
    console.error(
      `Error fetching user for user ${userId}:`, 
      error
    );
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}