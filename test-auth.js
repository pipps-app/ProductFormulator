// Simple test script to verify all auth endpoints
console.log('Starting auth endpoint tests...\n');

async function testAuth() {
  const baseUrl = 'http://localhost:5000';
  
  try {
    // Test 1: Logout (should work even without auth)
    console.log('1. Testing logout...');
    const logoutRes = await fetch(`${baseUrl}/api/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    console.log(`   Status: ${logoutRes.status}`);
    console.log(`   Response: ${await logoutRes.text()}\n`);
    
    // Test 2: Password reset request
    console.log('2. Testing password reset request...');
    const resetRes = await fetch(`${baseUrl}/api/auth/request-password-reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'jumelisa@yahoo.com' })
    });
    console.log(`   Status: ${resetRes.status}`);
    console.log(`   Response: ${await resetRes.text()}\n`);
    
    // Test 3: Registration
    console.log('3. Testing registration...');
    const regRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'testuser@example.com',
        password: 'testpass123',
        company: 'Test Company'
      })
    });
    console.log(`   Status: ${regRes.status}`);
    console.log(`   Response: ${await regRes.text()}\n`);
    
    // Test 4: Login with wrong password
    console.log('4. Testing login (wrong password)...');
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'jumelisa@yahoo.com',
        password: 'wrongpassword'
      })
    });
    console.log(`   Status: ${loginRes.status}`);
    console.log(`   Response: ${await loginRes.text()}\n`);
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testAuth();
