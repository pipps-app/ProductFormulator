import pg from 'pg';
const { Pool } = pg;

async function updateAdminUser() {
  const pool = new Pool({ 
    connectionString: 'postgresql://postgres:crystal1scan@localhost:5432/pipps_maker_calc' 
  });
  
  try {
    console.log('Updating admin user...');
    
    // This is the bcrypt hash for "123456"
    const hash = '$2b$10$CwTycUXWue0Thq9StjUM0uJ8V2nF.dvZtQ9dB8JaD5Zu0t2mKGbJu';
    
    const result = await pool.query(
      "UPDATE users SET password = $1, role = $2 WHERE email = 'admin@test.com'",
      [hash, 'admin']
    );
    
    if (result.rowCount > 0) {
      console.log('✅ Admin user updated successfully!');
      console.log('Login with: admin@test.com / 123456');
      console.log('Role set to: admin');
    } else {
      console.log('❌ User not found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

updateAdminUser();
