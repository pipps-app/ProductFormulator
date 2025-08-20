import postgres from 'postgres';

const connectionString = 'postgresql://postgres:postgres@localhost:5432/pipps_maker_calc';
const sql = postgres(connectionString);

async function markExistingUsersAsVerified() {
  try {
    console.log('Marking existing users as email verified...');
    
    // Update all existing users to be email verified
    // (since they were created before email verification was implemented)
    const result = await sql`
      UPDATE users 
      SET email_verified = true,
          email_verification_token = null,
          email_verification_expires = null
      WHERE email_verified IS NULL OR email_verified = false
    `;
    
    console.log(`✅ Updated ${result.count} existing users to be email verified`);
    
    // Show all users and their verification status
    const users = await sql`SELECT id, email, email_verified FROM users ORDER BY id`;
    
    console.log('\nUser verification status:');
    users.forEach(user => {
      console.log(`- ID: ${user.id}, Email: ${user.email}, Verified: ${user.email_verified}`);
    });
    
  } catch (error) {
    console.error('❌ Error updating users:', error);
  } finally {
    await sql.end();
    process.exit(0);
  }
}

markExistingUsersAsVerified();
