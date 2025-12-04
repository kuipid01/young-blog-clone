// /api/payments/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db"; // Replace with your actual Drizzle DB import
import { InferInsertModel, eq } from "drizzle-orm";
import { payments, PaymentType, paymentTypes } from "../../../lib/schema";

// Define the expected input type for POST request
type NewPayment = InferInsertModel<typeof payments>;

// Helper function to validate payment type
const isValidPaymentType = (type: string): type is PaymentType =>
  paymentTypes.includes(type as PaymentType);

export async function POST(req: NextRequest) {
  try {
    const body: NewPayment = await req.json();
    const { userId, amount, paymentType, proof } = body;

    // 1. Basic validation
    if (!userId || !amount || !paymentType) {
      return NextResponse.json(
        { message: "Missing required fields: userId, amount, paymentType" },
        { status: 400 }
      );
    }

    if (!isValidPaymentType(paymentType)) {
      return NextResponse.json(
        {
          message: `Invalid paymentType. Must be one of: ${paymentTypes.join(
            ", "
          )}`,
        },
        { status: 400 }
      );
    }

    // Ensure amount is a positive number string (Drizzle takes string for numeric)
    const amountValue = Number(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      return NextResponse.json(
        { message: "Amount must be a positive number." },
        { status: 400 }
      );
    }
    if (paymentType === "bank_transfer" && !proof) {
      return NextResponse.json(
        { message: `This paymentType requires proof.` },
        { status: 400 }
      );
    }

    // 2. Insert into the database
    const [newPayment] = await db
      .insert(payments)
      .values({
        userId,
        amount: amountValue.toFixed(2),
        paymentType,
        proof: proof || null,
        status:"pending",
      })
      .returning();

    return NextResponse.json(newPayment, { status: 201 });
  } catch (error) {
    console.error("Error creating payment:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
