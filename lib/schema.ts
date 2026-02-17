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
  pgEnum,
  json,
} from "drizzle-orm/pg-core";

import { createId } from "@paralleldrive/cuid2";

export const logStatusEnum = pgEnum("log_status", ["used", "unused"]);
export const affiliateStatusEnum = pgEnum("affiliate_status", [
  "pending_payment",
  "pending_approval",
  "active",
  "rejected",
  "suspended",
]);
export const bonusTypeEnum = pgEnum("bonus_type", ["referral", "store"]);
export type ProductType = InferSelectModel<typeof product>;
export type LogType = InferSelectModel<typeof logs>;
export type BasePaymentType = InferSelectModel<typeof payments>;
export type UserType = InferSelectModel<typeof user>;
export type ExtendedPaymentType = BasePaymentType & {
  id: string;
  userName: string;
  userEmail: string;
};

// --- USERS TABLE (Using CUID for ID) ---
export const user = pgTable("users", {
  // Primary Key: Use varchar, not serial. Set length (e.g., 30) and use $defaultFn for CUID generation.
  id: varchar("id", { length: 30 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => createId()),

  username: text("username"),
  bvn: text("bvn"),
  email: text("email"),
  password: text("password"),
  referralCode: varchar("referralCode", { length: 50 }).unique().notNull(),
  isAffiliate: boolean("is_affiliate").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// REFERRALS TABLE
export const referrals = pgTable("referrals", {
  id: varchar("id", { length: 30 })
    .primaryKey()
    .$defaultFn(() => createId()),

  referredUserId: varchar("referred_user_id", { length: 30 })
    .notNull()
    .references(() => user.id),

  referrerUserId: varchar("referrer_user_id", { length: 30 })
    .notNull()
    .references(() => user.id),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// BONUSES TABLE
export const bonuses = pgTable("bonuses", {
  id: varchar("id", { length: 30 })
    .primaryKey()
    .$defaultFn(() => createId()),

  referrerUserId: varchar("referrer_user_id", { length: 30 })
    .references(() => user.id),

  referredUserId: varchar("referred_user_id", { length: 30 })
    .references(() => user.id),

  paymentId: varchar("payment_id", { length: 30 })
    .references(() => payments.id),

  orderId: varchar("order_id", { length: 30 })
    .references(() => order.id),

  type: bonusTypeEnum("type").default("referral").notNull(),
  status: text("status").default("pending"),
  bonusAmount: numeric("bonus_amount").notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
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

  // Payment Reference
  paymentReference: text("payment_reference"),

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
  bankName: varchar("bank_name", { length: 255 }),
  flwRef: varchar("flw_ref", { length: 255 }),
  accountNumber: varchar("account_number", { length: 50 }),

  // --- Wallet Balance ---
  // The balance should be non-nullable and default to 0.00
  walletBalance: numeric("wallet_balance", { precision: 12, scale: 2 })
    .notNull()
    .default("0.00"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(), // Good for tracking updates
});

export const logs = pgTable("logs", {
  id: varchar("id", { length: 30 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => createId()),

  // Log Details: The descriptive string column
  logDetails: text("log_details").notNull(),

  // Status Field: Using the defined enum
  status: logStatusEnum("status").default("unused").notNull(),

  // Relationship with Product (One-to-Many: Multiple logs per product)
  productId: varchar("product_id")
    .notNull()
    .references(() => product.id),

  // orderId: varchar("order_id")
  //   .references(() => order.id)
  //   .unique(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});
// 3. Define the Relations
export const logsRelations = relations(logs, ({ one }) => ({
  // Define the 'one' relationship back to the product
  product: one(product, {
    fields: [logs.productId],
    references: [product.id],
  }),
}));
// --- ORDERS TABLE (New Schema) ---
export const order = pgTable("orders", {
  id: varchar("id", { length: 30 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => createId()),

  userId: varchar("user_id", { length: 30 })
    .notNull()
    .references(() => user.id),

  productId: varchar("product_id", { length: 30 }),

  logId: varchar("log_id", { length: 30 }).references(() => logs.id),
  trans_id: varchar("trans_id", { length: 50 }),

  data: json("data").notNull(),

  quantity: integer("quantity").notNull().default(1),
  totalPrice: numeric("total_price", { precision: 12, scale: 2 }).notNull(),
  
  totalAmount: numeric("total_amount", { precision: 12, scale: 2 }).notNull().default("0.00"),
  netAmount: numeric("net_amount", { precision: 12, scale: 2 }).notNull().default("0.00"),
  referralAmount: numeric("referral_amount", { precision: 12, scale: 2 }).notNull().default("0.00"),
  referrerId: varchar("referrer_id", { length: 30 }).references(() => user.id),

  status: varchar("status").notNull().default("pending_debit"),

  refundReason: text("refund_reason"),
  refundProof: text("refund_proof"),
  refundAccountName: varchar("refund_account_name"),
  refundAccountNumber: varchar("refund_account_number"),
  refundAdminNote: text("refund_admin_note"),
  refundBankName: varchar("refund_bank_name"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});


// SAVED BANK DETAILS TABLE
// SAVED BANK DETAILS TABLE (Removed)


export const orderRelations = relations(order, ({ one, many }) => ({
  user: one(user, {
    fields: [order.userId],
    references: [user.id],
  }),
  referrer: one(user, {
    fields: [order.referrerId],
    references: [user.id],
    relationName: "referrer",
  }),
  product: one(product, {
    fields: [order.productId],
    references: [product.id],
  }),
  log: one(logs),
  bonuses: many(bonuses),
  affiliateCommissions: many(affiliateCommissions),
}));

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
  affiliateProfile: one(affiliates, {
    fields: [user.id],
    references: [affiliates.userId],
  }),
  affiliateCommissions: many(affiliateCommissions),
}));

export const affiliates = pgTable("affiliates", {
  id: varchar("id", { length: 30 })
    .primaryKey()
    .$defaultFn(() => createId()),
  userId: varchar("user_id", { length: 30 })
    .notNull()
    .references(() => user.id)
    .unique(),
  status: affiliateStatusEnum("status").default("pending_payment").notNull(),
  commissionRate: numeric("commission_rate", {
    precision: 5,
    scale: 2,
  })
    .default("20.00")
    .notNull(),
  totalEarnings: numeric("total_earnings", {
    precision: 12,
    scale: 2,
  })
    .default("0.00")
    .notNull(),
  currentBalance: numeric("current_balance", {
    precision: 12,
    scale: 2,
  })
    .default("0.00")
    .notNull(),
  bankName: varchar("bank_name"),
  accountNumber: varchar("account_number"),
  accountName: varchar("account_name"),
  paymentProof: text("payment_proof"),
  paymentReference: text("payment_reference"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const affiliateCommissions = pgTable("affiliate_commissions", {
  id: varchar("id", { length: 30 })
    .primaryKey()
    .$defaultFn(() => createId()),

  orderId: varchar("order_id", { length: 30 })
    .notNull()
    .references(() => order.id),

  affiliateId: varchar("affiliate_id", { length: 30 })
    .notNull()
    .references(() => affiliates.id),

  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  rate: numeric("rate", { precision: 5, scale: 2 }).notNull(),
  status: text("status").default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const affiliatesRelations = relations(affiliates, ({ one }) => ({
  user: one(user, { fields: [affiliates.userId], references: [user.id] }),
}));

export const affiliateCommissionsRelations = relations(
  affiliateCommissions,
  ({ one }) => ({
    order: one(order, {
      fields: [affiliateCommissions.orderId],
      references: [order.id],
    }),
    affiliate: one(affiliates, {  
      fields: [affiliateCommissions.affiliateId],
      references: [affiliates.id],
    }),
  })
);
export const bonusesRelations = relations(bonuses, ({ one }) => ({
  referrer: one(user, {
    fields: [bonuses.referrerUserId],
    references: [user.id],
    relationName: "bonus_referrer",
  }),
  referred: one(user, {
    fields: [bonuses.referredUserId],
    references: [user.id],
    relationName: "bonus_referred",
  }),
  order: one(order, {
    fields: [bonuses.orderId],
    references: [order.id],
  }),
  payment: one(payments, {
    fields: [bonuses.paymentId],
    references: [payments.id],
  }),
}));


export const productsRelations = relations(product, ({ many }) => ({
  // Define the 'many' relationship to logs (One Product has Many Logs)
  logs: many(logs),
}));


export const withdrawalStatusEnum = pgEnum("withdrawal_status", [
  "pending",
  "approved",
  "rejected",
  "processing",
]);

export const withdrawalTypeEnum = pgEnum("withdrawal_type", ["automatic", "manual"]);

export const withdrawals = pgTable("withdrawals", {
  id: varchar("id", { length: 30 })
    .primaryKey()
    .$defaultFn(() => createId()),
  affiliateId: varchar("affiliate_id", { length: 30 })
    .notNull()
    .references(() => affiliates.id),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  status: withdrawalStatusEnum("status").default("pending").notNull(),
  type: withdrawalTypeEnum("type").default("automatic").notNull(),
  bankName: varchar("bank_name"),
  accountNumber: varchar("account_number"),
  accountName: varchar("account_name"),
  adminNote: text("admin_note"),
  adminProof: text("admin_proof"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const withdrawalMetadata = pgTable("withdrawal_metadata", {
  id: varchar("id", { length: 30 })
    .primaryKey()
    .$defaultFn(() => createId()),
  withdrawalId: varchar("withdrawal_id", { length: 30 })
    .notNull()
    .references(() => withdrawals.id),
  reference: varchar("reference").notNull().unique(),
  fee: numeric("fee", { precision: 12, scale: 2 }),
  currency: varchar("currency").default("NGN"),
  status: varchar("status").default("processing"),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const withdrawalMetadataRelations = relations(
  withdrawalMetadata,
  ({ one }) => ({
    withdrawal: one(withdrawals, {
      fields: [withdrawalMetadata.withdrawalId],
      references: [withdrawals.id],
    }),
  })
);

export const withdrawalsRelations = relations(withdrawals, ({ one, many }) => ({
  affiliate: one(affiliates, {
    fields: [withdrawals.affiliateId],
    references: [affiliates.id],
  }),
  metadata: many(withdrawalMetadata),
}));

