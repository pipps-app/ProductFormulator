const fetch = require('node-fetch');

async function checkStatus() {
    try {
        console.log('🔍 Checking soft launch status...');
        
        const response = await fetch('http://localhost:5000/api/soft-launch-status');
        const data = await response.json();
        
        console.log('📊 Current Status:');
        console.log('- Soft Launch Mode:', data.softLaunchMode ? '✅ ENABLED' : '❌ DISABLED');
        console.log('- Available Plans:', data.availablePlans || []);
        console.log('- Server Status:', response.ok ? '✅ Running' : '❌ Error');
        
        if (data.softLaunchMode) {
            console.log('\n🚀 Soft Launch is ACTIVE!');
            console.log('- Only free plan is available');
            console.log('- Premium plans show waiting list buttons');
        } else {
            console.log('\n💰 Full Launch Mode - All plans available');
        }
        
    } catch (error) {
        console.error('❌ Error checking status:', error.message);
    }
}

checkStatus();
