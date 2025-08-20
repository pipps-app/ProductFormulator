import postgres from 'postgres';

const connectionString = 'postgresql://postgres:postgres@localhost:5432/pipps_maker_calc';
const sql = postgres(connectionString);

async function addEmailVerificationFields() {
  try {
    console.log('Adding email verification fields to users table...');
    
    // Add email verification fields
    await sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS email_verification_token TEXT,
      ADD COLUMN IF NOT EXISTS email_verification_expires TIMESTAMP
    `;
    
    console.log('✅ Email verification fields added successfully!');
    
    // Drop user_sessions table if it exists
    try {
      await sql`DROP TABLE IF EXISTS user_sessions`;
      console.log('✅ Removed old user_sessions table');
    } catch (error) {
      console.log('ℹ️ user_sessions table did not exist');
    }
    
    console.log('✅ Database schema updated successfully!');
    
  } catch (error) {
    console.error('❌ Error updating database schema:', error);
  } finally {
    await sql.end();
    process.exit(0);
  }
}

addEmailVerificationFields();
