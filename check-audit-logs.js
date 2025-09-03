import { Pool } from 'pg';

const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/pipps_maker_calc'
});

async function checkAuditLogs() {
  try {
    console.log('🔍 Checking audit logs...');
    
    // Check if audit_logs table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'audit_logs'
      );
    `);
    console.log('Audit logs table exists:', tableCheck.rows[0].exists);
    
    if (tableCheck.rows[0].exists) {
      // Get recent audit logs for user 11
      const result = await pool.query(`
        SELECT id, user_id, action, entity_type, entity_id, changes, created_at, timestamp 
        FROM audit_logs 
        WHERE user_id = 11 
        ORDER BY created_at DESC 
        LIMIT 10
      `);
      
      console.log(`\nFound ${result.rows.length} audit logs for user 11:`);
      result.rows.forEach((log, index) => {
        const changes = log.changes ? JSON.parse(log.changes) : {};
        console.log(`${index + 1}. ${log.action} ${log.entity_type} (ID: ${log.entity_id})`);
        console.log(`   Created: ${log.created_at}`);
        console.log(`   Description: ${changes.description || 'No description'}`);
        console.log('');
      });
      
      // Also check total count
      const countResult = await pool.query('SELECT COUNT(*) as total FROM audit_logs WHERE user_id = 11');
      console.log(`Total audit logs for user 11: ${countResult.rows[0].total}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

checkAuditLogs();
