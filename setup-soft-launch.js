#!/usr/bin/env node

/**
 * Set up the soft launch waiting list system
 * Run: node setup-soft-launch.js
 */

import { Client } from 'pg';
import { readFileSync } from 'fs';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/pipps_maker_calc';

async function setupSoftLaunch() {
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('🔗 Connected to database');
    
    console.log('🚀 Setting up soft launch waiting list system...\n');
    
    // Read and execute the SQL file
    const sqlContent = readFileSync('add-waiting-list-table.sql', 'utf8');
    await client.query(sqlContent);
    
    console.log('✅ Database tables created successfully!');
    console.log('   - waiting_list table');
    console.log('   - app_settings table');
    console.log('   - Indexes and constraints');
    
    // Verify the setup
    const softLaunchMode = await client.query(`
      SELECT setting_value FROM app_settings WHERE setting_key = 'soft_launch_mode'
    `);
    
    const availablePlans = await client.query(`
      SELECT setting_value FROM app_settings WHERE setting_key = 'available_plans'
    `);
    
    console.log('\n📋 CURRENT CONFIGURATION:');
    console.log(`   Soft Launch Mode: ${softLaunchMode.rows[0]?.setting_value || 'Not set'}`);
    console.log(`   Available Plans: ${availablePlans.rows[0]?.setting_value || 'Not set'}`);
    
    console.log('\n🎯 NEXT STEPS:');
    console.log('   1. Update your frontend to show waiting list forms');
    console.log('   2. Test the waiting list signup process');
    console.log('   3. Configure email notifications');
    console.log('   4. Deploy to production when ready');
    
    console.log('\n💡 USEFUL COMMANDS:');
    console.log('   • Toggle to full launch: node toggle-launch-mode.js full');
    console.log('   • View waiting list stats: Check admin dashboard');
    console.log('   • Migrate waiting list: node migrate-waiting-list.js');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    
    if (error.message.includes('relation "app_settings" already exists')) {
      console.log('\n✅ Tables already exist - that\'s okay!');
      console.log('💡 Use: node toggle-launch-mode.js soft');
    }
  } finally {
    await client.end();
  }
}

setupSoftLaunch();
