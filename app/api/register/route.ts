import { eq } from "drizzle-orm";
import { db } from "../../../lib/db";
import { user } from "../../../lib/schema";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, email, password, referralCode } = body;

    // Check if user already exists
    const userExists = await db
      .select()
      .from(user)
      .where(eq(user.email, email));

    if (userExists.length > 0) {
      return new Response(
        JSON.stringify({ success: false, message: "User already exists" }),
        { status: 400 }
      );
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10); // 10 is the salt rounds

    // Insert new user
    const userRes = await db.insert(user).values({
      username,
      email,
      password: hashedPassword, 
      referralCode,
    });

    return new Response(JSON.stringify({ success: true, data: userRes }), {
      status: 201,
    });
  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ success: false, message: "Server error" }),
      { status: 500 }
    );
  }
}
