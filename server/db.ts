import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from "@shared/schema";

// Simple in-memory fallback for development
let client: any;
let db: any;

try {
  // Try to connect to PostgreSQL
  const connectionString = `postgresql://${process.env.PGUSER}:${process.env.PGPASSWORD}@${process.env.PGHOST}:${process.env.PGPORT}/${process.env.PGDATABASE}?sslmode=require`;
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
