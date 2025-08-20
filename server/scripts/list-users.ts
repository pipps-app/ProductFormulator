import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../../shared/schema';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/pipps_maker_calc';
const client = postgres(connectionString, {
  max: 5,
  idle_timeout: 10,
  connect_timeout: 5,
  prepare: false
});
const db = drizzle(client, { schema });

async function listUsers() {
  const users = await db.select().from(schema.users);
  console.log('Current users in database:');
  users.forEach(user => {
    console.log(`- ID: ${user.id}, Email: ${user.email}, Company: ${user.company}`);
  });
  process.exit(0);
}

listUsers().catch(console.error);
