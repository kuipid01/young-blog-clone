import { NextResponse } from "next/server";

import { eq } from "drizzle-orm";
import { user } from "../../../lib/schema";
import { db } from "../../../lib/db";

export async function POST(req: Request) {
  const { userId, username } = await req.json();
  const code = `${username}-${Math.random().toString(36).substring(2, 8)}`;

  await db.update(user)
    .set({ referralCode: code })
    .where(eq(user.id, userId));

  return NextResponse.json({ success: true, referralCode: code });
}
