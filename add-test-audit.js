import pkg from 'pg';
const { Client } = pkg;

async function addTestAuditLog() {
  const client = new Client({
    connectionString: 'postgresql://postgres:postgres@localhost:5432/pipps_maker_calc'
  });
  
  try {
    await client.connect();
    console.log('Connected to database');
    
    // First, let's see existing audit logs
    const existing = await client.query(`
      SELECT id, user_id, action, entity_type, created_at 
      FROM audit_logs 
      WHERE user_id = 11 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    console.log('Existing audit logs:');
    existing.rows.forEach(log => {
      console.log(`- ${log.action} ${log.entity_type} at ${log.created_at}`);
    });
    
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
      1, // entity_id
      JSON.stringify({
        description: 'Test audit log entry created to check recent activity display',
        testEntry: true
      }),
      now, // created_at
      now  // timestamp
    ]);
    
    console.log('\n✅ Added test audit log:', result.rows[0]);
    
    // Check the most recent logs again
    const updated = await client.query(`
      SELECT id, user_id, action, entity_type, created_at, changes 
      FROM audit_logs 
      WHERE user_id = 11 
      ORDER BY created_at DESC 
      LIMIT 3
    `);
    
    console.log('\nUpdated audit logs:');
    updated.rows.forEach(log => {
      const changes = JSON.parse(log.changes || '{}');
      console.log(`- ${log.action} ${log.entity_type} at ${log.created_at}: ${changes.description}`);
    });
    
  } catch(e) { 
    console.error('Error:', e.message); 
  } finally { 
    await client.end(); 
  }
}

addTestAuditLog();
