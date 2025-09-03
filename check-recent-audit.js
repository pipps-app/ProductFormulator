import { db } from "./server/database.js";
import { auditLogs } from "./server/schema.js";
import { eq, desc } from "drizzle-orm";

async function checkRecentAuditLogs() {
  try {
    console.log('🔍 Checking most recent audit logs for user 11...');
    
    // Get the most recent 5 audit logs for user 11
    const logs = await db.select().from(auditLogs)
      .where(eq(auditLogs.userId, 11))
      .orderBy(desc(auditLogs.createdAt))
      .limit(5);
      
    console.log(`Found ${logs.length} recent audit logs:`);
    logs.forEach((log, index) => {
      const changes = log.changes ? JSON.parse(log.changes) : {};
      console.log(`${index + 1}. [${log.createdAt}] ${log.action} ${log.entityType} (ID: ${log.entityId})`);
      console.log(`   Description: ${changes.description || 'No description'}`);
      console.log(`   Minutes ago: ${Math.round((Date.now() - new Date(log.createdAt).getTime()) / 60000)}`);
      console.log('');
    });
    
    // Check total count
    const [count] = await db.select({ 
      count: db.sql`count(*)`.as('count') 
    }).from(auditLogs).where(eq(auditLogs.userId, 11));
    
    console.log(`Total audit logs for user 11: ${count.count}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkRecentAuditLogs();
