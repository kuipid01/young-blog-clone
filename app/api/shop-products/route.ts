// Next.js API route: /api/products
import axios from "axios";
import { NextResponse } from "next/server";

export async function GET(req: Request, res: any) {
  
  try {
   
    const response = await axios.get(
      `https://shopviaclone22.com/api/products.php?api_key=${process.env.SHOPCLONEAPI}`
    );
    return NextResponse.json(response.data, { status: 200 });
  } catch (err) {
    console.error(`Error fetching  shop products:`, err);
    return NextResponse.json(
      { message: "Failed to fetch  shop products" },
      { status: 500 }
    );
  }
}
