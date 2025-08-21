import postgres from 'postgres';

async function checkUsers() {
  const connectionString = 'postgresql://postgres:postgres@localhost:5432/pipps_maker_calc';
  const sql = postgres(connectionString);
  
  try {
    console.log('🔍 Checking users in database...');
    const users = await sql`SELECT id, email, role, auth_provider FROM users LIMIT 5`;
    console.log('Users found:');
    users.forEach(user => {
      console.log(`- ID: ${user.id}, Email: ${user.email}, Role: ${user.role}, Auth: ${user.auth_provider}`);
    });
    
    if (users.length > 0) {
      // Let's use the first user to test API access
      const testUser = users[0];
      console.log(`\n🔍 Using user ${testUser.email} to test API access...`);
      
      // We need to create a proper JWT token or find another way to test
      console.log('Note: We need to either:');
      console.log('1. Create a proper JWT token for this user');
      console.log('2. Use the frontend to login and test');
      console.log('3. Temporarily disable auth for testing');
      
      console.log('\n📊 Database query result for formulations owned by user', testUser.id);
      const formulations = await sql`
        SELECT id, name, total_cost, unit_cost, profit_margin, is_active 
        FROM formulations 
        WHERE user_id = ${testUser.id}
      `;
      console.log('Formulations:');
      formulations.forEach(form => {
        console.log(`- ${form.name}: total_cost=${form.total_cost}, unit_cost=${form.unit_cost}, profit_margin=${form.profit_margin}`);
      });

      // Also check user 11 specifically  
      console.log('\n📊 Database query result for formulations owned by user 11 (jcepiphany@yahoo.com)');
      const formulations11 = await sql`
        SELECT id, name, total_cost, unit_cost, profit_margin, is_active 
        FROM formulations 
        WHERE user_id = 11
      `;
      console.log('User 11 Formulations:');
      formulations11.forEach(form => {
        console.log(`- ${form.name}: total_cost=${form.total_cost}, unit_cost=${form.unit_cost}, profit_margin=${form.profit_margin}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sql.end();
  }
}

checkUsers();
