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
  client = postgres(connectionString, {
    max: 5,
    idle_timeout: 10,
    connect_timeout: 5,
    prepare: false
  });
  db = drizzle(client, { schema });
} catch (error) {
  console.log('Database connection failed, using in-memory storage');
}

export { db };
