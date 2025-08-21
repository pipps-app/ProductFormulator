// Simple material ownership fix
const { Client } = require('pg');

async function fixOwnership() {
  const client = new Client({
    connectionString: 'postgresql://postgres:postgres@localhost:5432/pipps_maker_calc'
  });
  
  try {
    await client.connect();
    console.log('Connected to database');
    
    const result = await client.query('UPDATE raw_materials SET user_id = 11 WHERE user_id = 1');
    console.log(`✅ Updated ${result.rowCount} materials from user 1 to user 11`);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

fixOwnership();
