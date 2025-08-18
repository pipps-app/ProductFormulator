// Test script to verify the subscription update API endpoint
import fetch from 'node-fetch';

async function testSubscriptionUpdate() {
  const testData = {
    email: 'admin@test.com',
    subscriptionTier: 'pro',
    subscriptionStatus: 'active',
    duration: '1'
  };

  try {
    console.log('Testing subscription update endpoint...');
    console.log('Data:', testData);
    
    const response = await fetch('http://localhost:5000/api/admin/update-subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: In a real scenario, you'd need proper authentication cookies
      },
      body: JSON.stringify(testData)
    });

    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    
    const result = await response.text();
    console.log('Response:', result);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testSubscriptionUpdate();
