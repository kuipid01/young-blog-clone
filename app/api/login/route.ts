import { eq, or } from "drizzle-orm";
import { db } from "../../../lib/db";
import { user } from "../../../lib/schema";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!; // Add this to .env

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { details, password } = body; // details can be username or email
    console.log("detaials", details, password, "passowrd");
    // Check if user exists by username OR email
    const userExists = await db
      .select()
      .from(user)
      .where(or(eq(user.email, details), eq(user.username, details)));

    if (userExists.length === 0) {
      return new Response(
        JSON.stringify({ success: false, message: "User not found" }),
        { status: 404 }
      );
    }

    const foundUser = userExists[0];

    // Compare password
    const passwordMatch = await bcrypt.compare(
      password,
      foundUser.password as string
    );

    if (!passwordMatch) {
      return new Response(
        JSON.stringify({ success: false, message: "Invalid password" }),
        { status: 401 }
      );
    }

    // Create JWT
    const token = jwt.sign(
      {
        id: foundUser.id,
        username: foundUser.username,
        email: foundUser.email,
      },
      JWT_SECRET,
      { expiresIn: "7d" } // 7-day login
    );

    return new Response(
      JSON.stringify({
        success: true,
        token,
        user: {
          id: foundUser.id,
          username: foundUser.username,
          email: foundUser.email,
        },
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ success: false, message: "Server error" }),
      { status: 500 }
    );
  }
}
