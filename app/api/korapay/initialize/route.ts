import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../lib/db";
import { payments } from "../../../../lib/schema";

const KORAPAY_SECRET_KEY = process.env.KORAPAY_SECRET_KEY;
const KORAPAY_INITIALIZE_URL = "https://api.korapay.com/merchant/api/v1/charges/initialize";

export async function POST(req: NextRequest) {
    try {
        if (!KORAPAY_SECRET_KEY) {
            return NextResponse.json(
                { message: "Kora Secret Key is not configured" },
                { status: 500 }
            );
        }

        const body = await req.json();
        const {
            amount,
            currency,
            reference,
            customer,
            notification_url,
            narration,
            channels,
            default_channel,
            metadata,
            merchant_bears_cost,
        } = body;
        const redirect_url = process.env.NODE_ENV === "development" ? "http://localhost:3000/dashboard" : "https://jemilmarketplace.com/dashboard";
        // Basic validation
        if (!amount || !currency || !reference || !customer?.email) {
            return NextResponse.json(
                { message: "Missing required fields: amount, currency, reference, customer.email" },
                { status: 400 }
            );
        }

        const payload = {
            amount,
            currency,
            reference,
            customer,
            redirect_url,
            notification_url,
            narration,
            channels,
            default_channel,
            metadata,
            merchant_bears_cost,
        };

        const response = await fetch(KORAPAY_INITIALIZE_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${KORAPAY_SECRET_KEY}`,
            },
            body: JSON.stringify(payload),
        });

        const data = await response.json();
        await db.insert(payments).values({
            userId: metadata?.user_id,
            amount: Number(amount).toFixed(2),
            paymentType: "wallet",
            status: "pending",
            proof: `Kora Ref: ${reference}`,
            paymentReference: reference,
        });
        if (!response.ok) {
            return NextResponse.json(
                { message: data.message || "Failed to initialize Kora charge" },
                { status: response.status }
            );
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error("Error initializing Kora charge:", error);
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}
