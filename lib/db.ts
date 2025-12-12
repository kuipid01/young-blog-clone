import { config } from "dotenv";
import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool } from "@neondatabase/serverless";
import { schema } from "./exporter";

config({ path: ".env" });

// Create the pooled client (required for transactions)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Correct drizzle initialization
export const db = drizzle(pool, {
  schema,
});
