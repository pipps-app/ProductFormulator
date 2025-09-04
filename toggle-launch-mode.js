#!/usr/bin/env node

/**
 * Toggle between soft launch mode and full launch mode
 * Run: node toggle-launch-mode.js [soft|full]
 */

import { Client } from 'pg';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/pipps_maker_calc';

async function toggleLaunchMode(mode) {
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log(`\n🚀 Switching to ${mode} launch mode...\n`);
    
    if (mode === 'soft') {
      // Enable soft launch mode - only free tier available
      await client.query(`
        INSERT INTO app_settings (setting_key, setting_value)
        VALUES ('soft_launch_mode', 'true')
        ON CONFLICT (setting_key) 
        DO UPDATE SET setting_value = 'true', updated_at = CURRENT_TIMESTAMP
      `);
      
      await client.query(`
        INSERT INTO app_settings (setting_key, setting_value)
        VALUES ('available_plans', '["free"]')
        ON CONFLICT (setting_key) 
        DO UPDATE SET setting_value = '["free"]', updated_at = CURRENT_TIMESTAMP
      `);
      
      console.log('✅ SOFT LAUNCH MODE ENABLED');
      console.log('   📋 Only FREE tier is available');
      console.log('   📝 Higher tiers show waiting list signup');
      console.log('   📧 Waiting list notifications will be sent');
      
    } else if (mode === 'full') {
      // Disable soft launch mode - all tiers available
      await client.query(`
        INSERT INTO app_settings (setting_key, setting_value)
        VALUES ('soft_launch_mode', 'false')
        ON CONFLICT (setting_key) 
        DO UPDATE SET setting_value = 'false', updated_at = CURRENT_TIMESTAMP
      `);
      
      await client.query(`
        INSERT INTO app_settings (setting_key, setting_value)
        VALUES ('available_plans', '["free", "starter", "pro", "professional", "business", "enterprise"]')
        ON CONFLICT (setting_key) 
        DO UPDATE SET setting_value = '["free", "starter", "pro", "professional", "business", "enterprise"]', updated_at = CURRENT_TIMESTAMP
      `);
      
      console.log('✅ FULL LAUNCH MODE ENABLED');
      console.log('   💳 ALL subscription tiers are available');
      console.log('   🛒 Payment processing is active');
      console.log('   📊 Full subscription system is live');
      
      // Show waiting list stats
      const waitingListStats = await client.query(`
        SELECT 
          plan_interest, 
          COUNT(*) as count,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending
        FROM waiting_list 
        GROUP BY plan_interest 
        ORDER BY count DESC
      `);
      
      if (waitingListStats.rows.length > 0) {
        console.log('\n📊 WAITING LIST SUMMARY:');
        console.log('   Plan          | Total | Pending');
        console.log('   --------------|-------|--------');
        waitingListStats.rows.forEach(row => {
          const plan = row.plan_interest.padEnd(13);
          const total = row.count.toString().padStart(4);
          const pending = row.pending.toString().padStart(4);
          console.log(`   ${plan} | ${total}  | ${pending}`);
        });
        console.log('\n💡 TIP: Use the admin dashboard to notify waiting list members!');
      }
      
    } else {
      console.log('❌ Invalid mode. Use "soft" or "full"');
      console.log('   Examples:');
      console.log('   node toggle-launch-mode.js soft   # Enable soft launch');
      console.log('   node toggle-launch-mode.js full   # Enable full launch');
      return;
    }
    
    // Show current status
    const settings = await client.query(`
      SELECT setting_key, setting_value 
      FROM app_settings 
      WHERE setting_key IN ('soft_launch_mode', 'available_plans')
    `);
    
    console.log('\n📋 CURRENT SETTINGS:');
    settings.rows.forEach(row => {
      console.log(`   ${row.setting_key}: ${row.setting_value}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

// Get mode from command line argument
const mode = process.argv[2];

if (!mode) {
  console.log('🚀 Launch Mode Toggle');
  console.log('Usage: node toggle-launch-mode.js [soft|full]');
  console.log('');
  console.log('Modes:');
  console.log('  soft  - Enable soft launch (free tier only, waiting lists)');
  console.log('  full  - Enable full launch (all tiers, payment processing)');
  process.exit(1);
}

toggleLaunchMode(mode);
