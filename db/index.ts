import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";
import { config } from "dotenv";

// Load environment variables
config({ path: ".env" });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined");
}

console.log("Attempting to connect to database...");
console.log("Database URL:", process.env.DATABASE_URL.replace(/:[^@]+@/, ':****@')); // Log URL with password hidden

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  max: 1, // Limit the number of connections
  idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
  connectionTimeoutMillis: 2000, // Timeout after 2 seconds
});

// Test the connection
pool.connect((err, client, release) => {
  if (err) {
    console.error("Error connecting to the database:", err);
    console.error("Error details:", {
      message: err.message,
      stack: err.stack
    });
  } else {
    console.log("Successfully connected to the database");
    release();
  }
});

export const db = drizzle(pool, { schema });
