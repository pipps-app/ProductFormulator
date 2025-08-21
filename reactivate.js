import pkg from 'pg';
const { Client } = pkg;

async function reactivate() {
  const client = new Client({
    connectionString: 'postgresql://postgres:postgres@localhost:5432/pipps_maker_calc'
  });
  
  try {
    await client.connect();
    console.log('Connected to database');
    
    // Reactivate the formulation
    await client.query('UPDATE formulations SET is_active = true WHERE id = 12');
    console.log('✅ Reactivated formulation 12');
    
    // Check the result
    const result = await client.query('SELECT id, name, is_active FROM formulations WHERE id = 12');
    console.log('Updated formulation:', result.rows[0]);
    
  } catch(e) { 
    console.error('Error:', e.message); 
  } finally { 
    await client.end(); 
  }
}

reactivate();
