// lib/schema.ts

import { InferSelectModel, relations } from "drizzle-orm";
import {
  pgTable,
  text,
  numeric,
  varchar,
  timestamp,
  integer,
  boolean,
} from "drizzle-orm/pg-core";

import { createId } from "@paralleldrive/cuid2";

export type ProductType = InferSelectModel<typeof product>;

// --- USERS TABLE (Using CUID for ID) ---
export const user = pgTable("users", {
  // Primary Key: Use varchar, not serial. Set length (e.g., 30) and use $defaultFn for CUID generation.
  id: varchar("id", { length: 30 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => createId()),

  username: text("username"),
  email: text("email"),
  password: text("password"),
  referralCode: text("referralCode"),
});

// --- PRODUCTS TABLE (Using CUID for ID) ---
export const product = pgTable("products", {
  // Primary Key: Use varchar for CUID
  id: varchar("id", { length: 30 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => createId()),

  name: text("name").notNull(),
  category: text("category").notNull(),
  format: text("format").notNull(),
  price: numeric("price").notNull(),
  stock: numeric("stock").notNull(),
});

export const paymentTypes = ["bank_transfer", "card", "wallet"] as const;
export type PaymentType = (typeof paymentTypes)[number];

// --- PAYMENTS TABLE (Using CUID for ID) ---
export const payments = pgTable("payments", {
  // Primary Key: Use varchar for CUID
  id: varchar("id", { length: 30 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => createId()),

  // Foreign Key: References the CUID from the users table
  // The type and length must match the primary key of the 'user' table (varchar, length 30)
  userId: varchar("user_id", { length: 30 })
    .notNull()
    .references(() => user.id),

  // Amount: Stored as numeric/decimal for currency precision
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),

  //payment funding status
  status: text("status"),
  // Payment Type: Uses the defined enum values
  paymentType: varchar("payment_type", { enum: paymentTypes }).notNull(),

  // Proof: Optional string field for transaction hash or receipt URL
  proof: text("proof"),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const wallets = pgTable("wallets", {
  // Primary Key: Use the user's ID as the primary key for a 1:1 relationship
  // This enforces that each user can only have one wallet record.
  userId: varchar("user_id", { length: 30 })
    .notNull()
    .primaryKey()
    .references(() => user.id),

  // --- Personal Details ---
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  phoneNumber: varchar("phone_number", { length: 20 }),

  // --- Address Details (Optional fields) ---
  address: varchar("address", { length: 255 }),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 100 }),
  country: varchar("country", { length: 100 }),
  zipCode: varchar("zip_code", { length: 20 }),

  // --- Account/Bank Details (Optional for transfers, etc.) ---
  accountName: varchar("account_name", { length: 255 }),
  accountNumber: varchar("account_number", { length: 50 }),

  // --- Wallet Balance ---
  // The balance should be non-nullable and default to 0.00
  walletBalance: numeric("wallet_balance", { precision: 12, scale: 2 })
    .notNull()
    .default("0.00"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(), // Good for tracking updates
});

export const paymentsRelations = relations(payments, ({ one }) => ({
  user: one(user, {
    fields: [payments.userId],
    references: [user.id],
  }),
}));

// Add relations for the wallets table
export const walletsRelations = relations(wallets, ({ one }) => ({
  user: one(user, {
    fields: [wallets.userId],
    references: [user.id],
  }),
}));

// Update the user relations to include the wallet (1:1 relationship)
export const userRelations = relations(user, ({ many, one }) => ({
  // Existing relations...
  payments: many(payments),
  // New wallet relation
  wallet: one(wallets, {
    fields: [user.id],
    references: [wallets.userId],
  }),
}));
