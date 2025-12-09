// app/api/convert-price/route.ts
import { NextResponse } from "next/server";
import { getNigerianPrice } from "../../utils/get-nigerian-price";

export async function POST(req: Request) {
  const { usdPrice } = await req.json();
  
  try {
    const ngnPrice = await getNigerianPrice(usdPrice);
    console.log("NIGERIAN PRICE", ngnPrice);
    return NextResponse.json({ ngnPrice });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to convert price" },
      { status: 500 }
    );
  }
}