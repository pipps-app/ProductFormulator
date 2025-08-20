import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../../shared/schema';
import { ne } from 'drizzle-orm';

const connectionString = 'postgresql://postgres:postgres@localhost:5432/pipps_maker_calc';
const client = postgres(connectionString, {
  max: 5,
  idle_timeout: 10,
  connect_timeout: 5,
  prepare: false
});
const db = drizzle(client, { schema });

async function cleanupUsers() {
  console.log('=== User Cleanup Script ===');
  
  // Keep only growjamaica@yahoo.com
  const keepEmail = 'growjamaica@yahoo.com';
  
  console.log(`\nDeleting all users EXCEPT: ${keepEmail}`);
  
  // Delete all users except the one we want to keep
  const deleteResult = await db.delete(schema.users)
    .where(ne(schema.users.email, keepEmail));
    
  console.log(`\n✅ Cleanup completed!`);
  
  // Verify what's left
  const remainingUsers = await db.select().from(schema.users);
  console.log('\nRemaining users in database:');
  remainingUsers.forEach(user => {
    console.log(`- ID: ${user.id}, Email: ${user.email}, Company: ${user.company || 'N/A'}`);
  });
  
  console.log(`\nTotal users remaining: ${remainingUsers.length}`);
  
  process.exit(0);
}

cleanupUsers().catch(error => {
  console.error('Error during cleanup:', error);
  process.exit(1);
});
