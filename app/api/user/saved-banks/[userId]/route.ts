
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { savedBankDetails } from "@/lib/schema";


export async function GET(
    req: Request,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const { userId } = await params;

        if (!userId) {
            return NextResponse.json(
                { message: "User ID is required" },
                { status: 400 }
            );
        }

        const banks = await db.query.savedBankDetails.findMany({
            where: eq(savedBankDetails.userId, userId),
            orderBy: (savedBankDetails, { desc }) => [desc(savedBankDetails.createdAt)],
        });

        return NextResponse.json(banks, { status: 200 });
    } catch (error) {
        console.error("Error fetching saved banks:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}
