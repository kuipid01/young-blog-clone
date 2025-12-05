// /api/payments/[userId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { payments } from "../../../../lib/schema";

export async function GET(
  req: Request,
  ctx: RouteContext<"/api/wallet/[userId]">
) {
  try {
    const { userId } = await ctx.params;

    if (!userId) {
      return NextResponse.json(
        { message: "Missing user ID in path parameters." },
        { status: 400 }
      );
    }

    // Use Drizzle's `eq` to filter by userId
    const userPayments = await db
      .select()
      .from(payments)
      .where(eq(payments.userId, userId));

    if (userPayments.length === 0) {
      return NextResponse.json(
        { message: `No payments found for user ID: ${userId}` },
        { status: 404 }
      );
    }

    return NextResponse.json(userPayments, { status: 200 });
  } catch (error) {
    console.error(`Error fetching payments for user `, error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
