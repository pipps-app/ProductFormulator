import { db } from "./server/database.js";
import { auditLogs } from "./server/schema.js";
import { eq, desc } from "drizzle-orm";

async function updateOldAuditLog() {
  try {
    console.log('Updating an old audit log with recent timestamp...');
    
    // Get the most recent audit log for user 11
    const [recentLog] = await db.select().from(auditLogs)
      .where(eq(auditLogs.userId, 11))
      .orderBy(desc(auditLogs.createdAt))
      .limit(1);
      
    if (recentLog) {
      console.log('Found recent log:', recentLog);
      
      // Update it with current timestamp
      const now = new Date();
      const [updated] = await db.update(auditLogs)
        .set({ 
          createdAt: now,
          timestamp: now,
          changes: JSON.stringify({
            description: 'Updated material "Test Material" - cost refreshed for current market prices',
            testUpdate: true,
            originalDate: recentLog.createdAt
          })
        })
        .where(eq(auditLogs.id, recentLog.id))
        .returning();
        
      console.log('✅ Updated audit log:', updated);
    } else {
      console.log('No audit logs found for user 11');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

updateOldAuditLog();
