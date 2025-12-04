import { NextResponse } from "next/server";
import { db } from "../../../../lib/db";
import { order } from "../../../../lib/schema";
import { eq } from "drizzle-orm";

// GET /api/orders/[userId]
export async function GET(
  req: Request,
  ctx: RouteContext<"/api/wallet/[userId]">
) {
  const { userId } = await ctx.params;

  if (!userId) {
    return NextResponse.json(
      { message: "User ID is required." },
      { status: 400 }
    );
  }

  try {
    // Using mockDb pattern:
    const userOrders = await db
      .select()
      .from(order)
      .where(eq(order.userId, userId));

    // Filter the mock data to match the requested userId
    const filteredOrders = userOrders.filter((o: any) => o.userId === userId);

    return NextResponse.json(filteredOrders, { status: 200 });
  } catch (error) {
    console.error(`Error fetching orders for user ${userId}:`, error);
    return NextResponse.json(
      { message: "Failed to fetch user orders" },
      { status: 500 }
    );
  }
}
