const { Client } = require('pg');

async function checkDatabase() {
  const client = new Client({
    connectionString: 'postgresql://postgres:postgres@localhost:5432/pipps_maker_calc'
  });

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database successfully');

    // Check if jcepiphany@yahoo.com exists
    const result = await client.query(`
      SELECT id, email, subscription_plan, subscription_status, 
             subscription_start_date, subscription_end_date,
             created_at
      FROM users 
      WHERE email = $1
    `, ['jcepiphany@yahoo.com']);

    if (result.rows.length > 0) {
      console.log('\n📧 Found user jcepiphany@yahoo.com:');
      console.log(JSON.stringify(result.rows[0], null, 2));
    } else {
      console.log('\n❌ User jcepiphany@yahoo.com not found');
      
      // Let's see what users do exist
      const allUsers = await client.query('SELECT id, email FROM users ORDER BY id LIMIT 5');
      console.log('\nFirst 5 users in database:');
      allUsers.rows.forEach(user => {
        console.log(`- ID: ${user.id}, Email: ${user.email}`);
      });
    }

  } catch (error) {
    console.error('❌ Database error:', error.message);
  } finally {
    await client.end();
  }
}

checkDatabase();
