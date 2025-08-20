import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../../shared/schema';
import { eq } from 'drizzle-orm';

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString, {
  max: 5,
  idle_timeout: 10,
  connect_timeout: 5,
  prepare: false
});
const db = drizzle(client, { schema });

async function deleteUserByEmail(email: string) {
  const users = await db.select().from(schema.users).where(eq(schema.users.email, email));
  if (users.length === 0) {
    console.log(`No user found with email: ${email}`);
    process.exit(0);
  }
  const user = users[0];
  await db.delete(schema.users).where(eq(schema.users.email, email));
  console.log(`Deleted user with email: ${email} (id: ${user.id})`);
  process.exit(0);
}

const email = process.argv[2];
if (!email) {
  console.error('Usage: tsx delete-user.ts <email>');
  process.exit(1);
}

deleteUserByEmail(email);
