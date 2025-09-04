#!/usr/bin/env node

/**
 * Remove all soft launch components (if you want to completely clean up)
 * WARNING: This will delete all waiting list data permanently!
 */

import { Client } from 'pg';
import { readFileSync } from 'fs';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/pipps_maker_calc';

async function removeSoftLaunchComponents() {
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    
    console.log('⚠️  WARNING: This will permanently remove all soft launch components!');
    console.log('   - Waiting list table and all data');
    console.log('   - App settings table');
    console.log('   - All soft launch configuration');
    console.log('');
    console.log('❓ Are you absolutely sure? Type "YES DELETE" to continue:');
    
    // In a real scenario, you'd want to prompt for confirmation
    // For now, just show what would be deleted
    
    console.log('\n📊 CURRENT WAITING LIST DATA:');
    const waitingListCount = await client.query('SELECT COUNT(*) FROM waiting_list');
    console.log(`   Total entries: ${waitingListCount.rows[0].count}`);
    
    const planBreakdown = await client.query(`
      SELECT plan_interest, COUNT(*) as count 
      FROM waiting_list 
      GROUP BY plan_interest
    `);
    
    if (planBreakdown.rows.length > 0) {
      console.log('   By plan:');
      planBreakdown.rows.forEach(row => {
        console.log(`     ${row.plan_interest}: ${row.count}`);
      });
    }
    
    console.log('\n🔧 TO COMPLETE REMOVAL, RUN THESE SQL COMMANDS:');
    console.log('```sql');
    console.log('-- Backup waiting list data first (optional)');
    console.log("\\copy waiting_list TO 'waiting_list_backup.csv' DELIMITER ',' CSV HEADER;");
    console.log('');
    console.log('-- Remove soft launch components');
    console.log('DROP TABLE IF EXISTS waiting_list;');
    console.log('DROP TABLE IF EXISTS app_settings;');
    console.log('```');
    
    console.log('\n💡 RECOMMENDATION:');
    console.log('   Instead of deleting, consider keeping the tables for future use.');
    console.log('   You can simply switch to full launch mode with:');
    console.log('   node toggle-launch-mode.js full');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

removeSoftLaunchComponents();
