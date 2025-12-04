import { db } from "@/lib/db";
import { product } from "@/lib/schema";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, category, format, price, stock } = body;

    if (!name || !category || !format || !price || !stock) {
      return NextResponse.json(
        { success: false, message: "All fields are required" },
        { status: 400 }
      );
    }

    const res = await db.insert(product).values({
      name,
      category,
      format,
      price,
      stock,
    });

    return NextResponse.json({ success: true, data: res }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const products = await db.select().from(product);
    // console.log("products from db", products);
    return NextResponse.json(
      { success: true, data: products },
      { status: 200 }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
