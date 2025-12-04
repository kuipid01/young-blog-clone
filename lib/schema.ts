// lib/schema.ts

import {  InferSelectModel } from "drizzle-orm";
import { pgTable, serial, text,numeric } from "drizzle-orm/pg-core";



export type ProductType = InferSelectModel<typeof product>;



export const user = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username"),
  email: text("email"),
  password: text("password"),
  referralCode: text("referralCode"),
});


export const product = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  format: text("format").notNull(), 
  price: numeric("price").notNull(),
  stock: numeric("stock").notNull(),
});
