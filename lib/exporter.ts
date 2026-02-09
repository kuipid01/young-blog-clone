// lib/schema.ts (Ensure this structure)

import {
  logs,
  order,
  payments,
  paymentsRelations,
  product,
  user,
  userRelations,
  wallets,
  walletsRelations,
  affiliates,
  affiliatesRelations,
  referrals,
} from "./schema";

// ... (your table definitions: user, product, payments, wallets) ...

// You need to import ALL components of your schema here
export * from "./schema"; // Example: Re-exporting tables, types, and relations

// 💡 Export all tables and relations in a single object for Drizzle initialization
export const schema = {
  // Tables
  payments,
  wallets,
  user,
  product,
  logs,
  order,
referrals,
  paymentsRelations,
  walletsRelations,
  userRelations,
  affiliates,
  affiliatesRelations,
};
