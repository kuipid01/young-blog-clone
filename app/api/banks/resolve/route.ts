import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { bank, account } = body;

    if (!bank || !account) {
      return new NextResponse("Missing bank code or account number", {
        status: 400,
      });
    }

    const response = await fetch(
      "https://api.korapay.com/merchant/api/v1/misc/banks/resolve",
      {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.KORAPAY_SECRET_KEY}`,
        },
        body: JSON.stringify({ bank, account }),
      }
    );

    const data = await response.json();

    if (!data.status) {
        return NextResponse.json(data, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error resolving bank account:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
