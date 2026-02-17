import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = await fetch(
      "https://api.korapay.com/merchant/api/v1/misc/banks?countryCode=NG",
      {
        headers: {
          Authorization: `Bearer ${process.env.KORAPAY_PUBLIC_KEY_TEST}`,
        },
      }
    );

    if (!response.ok) {
        throw new Error(`KoraPay API error: ${response.statusText}`);
    }


    const data = await response.json();
    console.log(data,"bank data returned")
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching banks:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
