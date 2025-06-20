import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from "@shared/schema";

// Construct connection string from individual env vars since DATABASE_URL is corrupted
const connectionString = `postgresql://${process.env.PGUSER}:${process.env.PGPASSWORD}@${process.env.PGHOST}:${process.env.PGPORT}/${process.env.PGDATABASE}?sslmode=require`;

// Create postgres client with connection pooling and increased timeouts
const client = postgres(connectionString, {
  max: 10,
  idle_timeout: 60,
  connect_timeout: 30,
  prepare: false
});

export const db = drizzle(client, { schema });
