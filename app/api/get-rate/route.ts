// app/api/convert-price/route.ts
import { NextResponse } from "next/server";
import { getNigerianPrice, getUSDToNGNRate } from "../../utils/get-nigerian-price";

export async function GET(req: Request) {
 
  try {
    const rate = await getUSDToNGNRate();
    console.log("rate", rate );
    return NextResponse.json({ rate });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to get rate" },
      { status: 500 }
    );
  }
}