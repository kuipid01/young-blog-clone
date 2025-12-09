import { NextResponse } from "next/server";
import { db } from "../../../../lib/db";
import { logs, order, product, user } from "../../../../lib/schema";
import { eq } from "drizzle-orm";

// GET /api/orders/[userId]
export async function GET(
  req: Request,
  ctx: RouteContext<"/api/orders/[userId]">
) {
  const { userId } = await ctx.params;

  if (!userId) {
    return NextResponse.json(
      { message: "User ID is required." },
      { status: 400 }
    );
  }

  try {
    const rows = await db
      .select({
        order: {
          id: order.id,
          userId: order.userId,
          productId: order.productId,
          quantity: order.quantity,
          totalPrice: order.totalPrice,
          status: order.status,
          data: order.data,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
        },
        product: {
          id: product.id,
          name: product.name,
          price: product.price,
          stock: product.stock,
          category: product.category,
          inStock: product.stock,
        },
        logs: {
          id:logs.id,
          logDetails: logs.logDetails,
          status:logs.status
        },
      })
      .from(order)
      .leftJoin(product, eq(order.productId, product.id))
      .leftJoin(logs, eq(order.logId, logs.id))
      .where(eq(order.userId, userId));

    const formattedData = rows.map((row) => ({
      ...row.order,
      product: {
        ...row.product,
      },
      log:{
        ...row.logs
      }
    }));
    // Return directly — already nested
    return NextResponse.json(formattedData, { status: 200 });
  } catch (error) {
    console.error(`Error fetching orders for user ${userId}:`, error);
    return NextResponse.json(
      { message: "Failed to fetch user orders" },
      { status: 500 }
    );
  }
}
