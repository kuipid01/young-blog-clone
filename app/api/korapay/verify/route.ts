import { NextRequest, NextResponse } from "next/server";

const KORAPAY_SECRET_KEY = process.env.KORAPAY_SECRET_KEY;

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const reference = searchParams.get("reference");

        if (!reference) {
            return NextResponse.json(
                { message: "Transaction reference is required" },
                { status: 400 }
            );
        }

        if (!KORAPAY_SECRET_KEY) {
            return NextResponse.json(
                { message: "Kora Secret Key is not configured" },
                { status: 500 }
            );
        }

        const KORAPAY_VERIFY_URL = `https://api.korapay.com/merchant/api/v1/charges/${reference}`;

        const response = await fetch(KORAPAY_VERIFY_URL, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${KORAPAY_SECRET_KEY}`,
            },
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(
                { message: data.message || "Failed to verify Kora charge" },
                { status: response.status }
            );
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error("Error verifying Kora charge:", error);
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}
