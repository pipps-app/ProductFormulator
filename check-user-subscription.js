const { Pool } = require('pg');

async function checkUserSubscription() {
  const pool = new Pool({ 
    connectionString: 'postgresql://postgres:postgres@localhost:5432/pipps_maker_calc' 
  });
  
  try {
    console.log('Checking all users...');
    
    // First get all users to see what emails exist
    const allUsers = await pool.query('SELECT id, email, subscription_plan, subscription_status FROM users ORDER BY id');
    console.log('\nAll users:');
    allUsers.rows.forEach(user => {
      console.log(`ID: ${user.id}, Email: ${user.email}, Plan: ${user.subscription_plan || 'null'}, Status: ${user.subscription_status || 'null'}`);
    });
    
    // Now specifically check for the user we're looking for
    const targetEmails = ['jcepiphany@yahoo.com', 'growjamaica@yahoo.com'];
    
    for (const email of targetEmails) {
      console.log(`\nChecking ${email}:`);
      const result = await pool.query(`
        SELECT id, email, subscription_plan, subscription_status, 
               subscription_start_date, subscription_end_date 
        FROM users WHERE email = $1
      `, [email]);
      
      if (result.rows.length > 0) {
        console.log(JSON.stringify(result.rows[0], null, 2));
      } else {
        console.log('User not found');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

checkUserSubscription();
