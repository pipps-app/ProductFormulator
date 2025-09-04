#!/usr/bin/env node

/**
 * Convert waiting list members to active subscriptions
 * Run this when you go live to automatically convert early adopters
 */

import { Client } from 'pg';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/pipps_maker_calc';

async function migrateWaitingListToSubscriptions() {
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('🔄 Starting waiting list to subscription migration...\n');
    
    // Get all pending waiting list entries
    const waitingList = await client.query(`
      SELECT id, email, name, company, plan_interest, phone, created_at
      FROM waiting_list 
      WHERE status = 'pending'
      ORDER BY created_at ASC
    `);
    
    console.log(`📊 Found ${waitingList.rows.length} pending waiting list entries`);
    
    if (waitingList.rows.length === 0) {
      console.log('✅ No pending entries to migrate');
      return;
    }
    
    console.log('\n🎯 MIGRATION STRATEGY:');
    console.log('   1. Create user accounts for waiting list members');
    console.log('   2. Send welcome emails with special launch pricing');
    console.log('   3. Mark waiting list entries as "contacted"');
    console.log('   4. Generate discount codes for early adopters\n');
    
    // Group by plan for reporting
    const planGroups = {};
    waitingList.rows.forEach(entry => {
      if (!planGroups[entry.plan_interest]) {
        planGroups[entry.plan_interest] = [];
      }
      planGroups[entry.plan_interest].push(entry);
    });
    
    console.log('📋 WAITING LIST BREAKDOWN:');
    Object.entries(planGroups).forEach(([plan, entries]) => {
      console.log(`   ${plan}: ${entries.length} members`);
    });
    
    console.log('\n🎁 SUGGESTED LAUNCH STRATEGY:');
    console.log('   • Offer 30% off first 3 months for early adopters');
    console.log('   • Send personalized welcome emails');
    console.log('   • Provide priority onboarding support');
    console.log('   • Create special "Founder" badge/recognition');
    
    // Generate migration SQL for each plan
    console.log('\n📝 MIGRATION ACTIONS NEEDED:');
    
    for (const [plan, entries] of Object.entries(planGroups)) {
      console.log(`\n${plan.toUpperCase()} PLAN (${entries.length} members):`);
      
      entries.forEach((entry, index) => {
        console.log(`   ${index + 1}. ${entry.name || 'No name'} (${entry.email})`);
        console.log(`      Company: ${entry.company || 'Not provided'}`);
        console.log(`      Joined waiting list: ${entry.created_at.toDateString()}`);
      });
      
      // Generate example discount code
      const discountCode = `EARLY${plan.toUpperCase()}30`;
      console.log(`   🎫 Suggested discount code: ${discountCode}`);
    }
    
    // Option to automatically create user accounts
    console.log('\n❓ Would you like to automatically create user accounts? (y/N)');
    
    // For now, just mark as contacted and provide manual steps
    console.log('\n🔧 MANUAL STEPS TO COMPLETE MIGRATION:');
    console.log('   1. Set up discount codes in your payment system');
    console.log('   2. Create personalized email templates');
    console.log('   3. Send welcome emails to waiting list members');
    console.log('   4. Mark entries as "contacted" after sending emails');
    console.log('   5. Update to "converted" once they subscribe');
    
    // Update status to show they've been processed
    await client.query(`
      UPDATE waiting_list 
      SET status = 'contacted', 
          notified_at = CURRENT_TIMESTAMP 
      WHERE status = 'pending'
    `);
    
    console.log(`\n✅ Marked ${waitingList.rows.length} entries as "contacted"`);
    console.log('💡 TIP: Use the admin dashboard to track conversion progress');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

migrateWaitingListToSubscriptions();
