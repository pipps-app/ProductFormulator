const { Client } = require('pg');

async function checkRecentActivity() {
  const client = new Client({ 
    connectionString: 'postgresql://postgres:postgres@localhost:5432/pipps_maker_calc' 
  });
  
  try {
    await client.connect();
    console.log('📊 Recent audit logs for all users:');
    
    const logs = await client.query(`
      SELECT al.id, al.action, al.entity_type, al.changes, al.timestamp, u.email
      FROM audit_log al
      JOIN users u ON al.user_id = u.id
      ORDER BY al.timestamp DESC 
      LIMIT 10
    `);
    
    if (logs.rows.length === 0) {
      console.log('❌ No audit logs found');
    } else {
      logs.rows.forEach((log, i) => {
        const changes = JSON.parse(log.changes || '{}');
        const desc = changes.description || 'No description';
        const timeAgo = Math.round((Date.now() - new Date(log.timestamp).getTime()) / (1000 * 60));
        console.log(`${i+1}. [${timeAgo} min ago] ${log.email}: ${log.action} ${log.entity_type}`);
        console.log(`   ${desc}`);
      });
    }
    
    // Also check for materials created today
    console.log('\n📦 Materials created today:');
    const materials = await client.query(`
      SELECT rm.id, rm.name, rm.created_at, u.email
      FROM raw_materials rm
      JOIN users u ON rm.user_id = u.id
      WHERE DATE(rm.created_at) = CURRENT_DATE
      ORDER BY rm.created_at DESC
    `);
    
    materials.rows.forEach((mat) => {
      const timeAgo = Math.round((Date.now() - new Date(mat.created_at).getTime()) / (1000 * 60));
      console.log(`- ${mat.name} (ID: ${mat.id}) by ${mat.email} [${timeAgo} min ago]`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
  }
}

checkRecentActivity();
