import pg from 'pg';
const { Pool } = pg;

async function checkAdminUser() {
  const pool = new Pool({ 
    connectionString: 'postgresql://postgres:crystal1scan@localhost:5432/pipps_maker_calc' 
  });
  
  try {
    console.log('Checking admin user status...');
    
    const result = await pool.query(
      "SELECT email, role, password IS NOT NULL as has_password FROM users WHERE email = 'admin@test.com'"
    );
    
    if (result.rows.length > 0) {
      const user = result.rows[0];
      console.log('✅ Admin user found:');
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Has Password: ${user.has_password}`);
    } else {
      console.log('❌ Admin user not found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

checkAdminUser();
