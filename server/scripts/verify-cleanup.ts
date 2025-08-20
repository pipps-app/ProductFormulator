import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../../shared/schema';

const connectionString = 'postgresql://postgres:postgres@localhost:5432/pipps_maker_calc';
const client = postgres(connectionString, {
  max: 5,
  idle_timeout: 10,
  connect_timeout: 5,
  prepare: false
});
const db = drizzle(client, { schema });

async function verifyCleanup() {
  try {
    const users = await db.select().from(schema.users);
    console.log('=== VERIFICATION: Users in database ===');
    console.log(`Total users: ${users.length}`);
    users.forEach(user => {
      console.log(`- ID: ${user.id}, Email: ${user.email}, Company: ${user.company || 'N/A'}`);
    });
    
    if (users.length === 1 && users[0].email === 'growjamaica@yahoo.com') {
      console.log('\n✅ SUCCESS: Only growjamaica@yahoo.com remains!');
    } else {
      console.log('\n❌ WARNING: Unexpected users found!');
    }
  } catch (error) {
    console.error('Error:', error);
  }
  process.exit(0);
}

verifyCleanup();
