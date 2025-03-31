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
  max: 1,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  application_name: 'image-scorer',
});

// Test the connection with retries
const testConnection = async (retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const client = await pool.connect();
      console.log(`Successfully connected to the database (attempt ${i + 1}/${retries})`);
      client.release();
      return;
    } catch (err) {
      console.error(`Connection attempt ${i + 1}/${retries} failed:`, err);
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retrying
      }
    }
  }
  throw new Error("Failed to connect to database after multiple attempts");
};

// Test the connection
testConnection().catch(err => {
  console.error("Error connecting to the database:", err);
  console.error("Error details:", {
    message: err.message,
    stack: err.stack
  });
});

export const db = drizzle(pool, { schema });
