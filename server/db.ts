import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from "@shared/schema";

console.log("--- DATABASE CONNECTION TRUTH ---");
console.log("Attempting to connect to:", process.env.DATABASE_URL);
console.log("---------------------------------");

// Simple in-memory fallback for development
let client: any;
let db: any;

try {
  // Use DATABASE_URL from environment only
  const connectionString = process.env.DATABASE_URL!;
  console.log("🔗 Creating PostgreSQL connection...");
  client = postgres(connectionString, {
    max: 5,
    idle_timeout: 10,
    connect_timeout: 5,
    prepare: false
  });
  db = drizzle(client, { schema });
  console.log("✅ PostgreSQL connection established successfully!");
} catch (error) {
  console.error('❌ Database connection failed:', error);
  console.error('🚫 STOPPING SERVER - Database connection required for production compatibility');
  process.exit(1); // Stop the server instead of falling back
}

export { db };
