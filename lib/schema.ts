// lib/schema.ts
import { pgTable, serial, text } from "drizzle-orm/pg-core";

export const user = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username"),
  email: text("email"),
  password: text("password"),
  referralCode: text("referralCode"),
});
