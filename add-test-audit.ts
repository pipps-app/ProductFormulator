import pkg from 'pg';
const { Client } = pkg;

async function addTestAuditLog() {
  const client = new Client({
    connectionString: 'postgresql://postgres:postgres@localhost:5432/pipps_maker_calc'
  });
  
  try {
    await client.connect();
    console.log('Connected to database');
    
    // Add a test audit log with current timestamp
    const now = new Date();
    const result = await client.query(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, changes, created_at, timestamp)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [
      11, // user_id
      'update', // action
      'material', // entity_type  
      999, // entity_id (fake ID for testing)
      JSON.stringify({
        description: 'TEST: Updated material prices for better cost accuracy',
        testEntry: true,
        timestamp: now.toISOString()
      }),
      now, // created_at
      now  // timestamp
    ]);
    
    console.log('✅ Added test audit log:', result.rows[0]);
    console.log('Test entry should now appear in recent activity');
    
  } catch(e) { 
    console.error('Error:', e.message); 
    console.error('Full error:', e);
  } finally { 
    await client.end(); 
  }
}

addTestAuditLog();
