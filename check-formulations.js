import pkg from 'pg';
const { Client } = pkg;

async function check() {
  const client = new Client({
    connectionString: 'postgresql://postgres:postgres@localhost:5432/pipps_maker_calc'
  });
  
  try {
    await client.connect();
    console.log('Connected to database');
    
    const result = await client.query('SELECT id, name, is_active, total_cost, unit_cost FROM formulations ORDER BY id');
    console.log(`Found ${result.rows.length} formulations:`);
    
    result.rows.forEach(f => {
      console.log(`- ID ${f.id}: "${f.name}" (active: ${f.is_active})`);
      console.log(`  Total Cost: ${f.total_cost}, Unit Cost: ${f.unit_cost}`);
    });
    
  } catch(e) { 
    console.error('Error:', e.message); 
  } finally { 
    await client.end(); 
  }
}

check();
