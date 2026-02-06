
import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../../lib/db";
import { affiliates } from "../../../../../lib/schema";
import { eq } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> } // params is a Promise now
) {
  try {
    const { userId } = await params; // await the promise

    if (!userId) {
      return NextResponse.json(
        { message: "User ID is required" },
        { status: 400 }
      );
    }

    const affiliate = await db.query.affiliates.findFirst({
      where: eq(affiliates.userId, userId),
    });

    return NextResponse.json({
      success: true,
      affiliate: affiliate || null,
    });
  } catch (error: any) {
    console.error("Error fetching affiliate status:", error);
    console.error("Error details:", error.message);
    if (!db.query.affiliates) {
        console.error("CRITICAL: db.query.affiliates is undefined. Check schema export.");
    }
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
