// Test authentication endpoints
const baseUrl = 'http://localhost:5000';

async function testEndpoint(name, url, options = {}) {
  try {
    console.log(`\n=== Testing ${name} ===`);
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      ...options
    });
    
    const text = await response.text();
    console.log(`Status: ${response.status}`);
    console.log(`Body: ${text}`);
    
    return { status: response.status, body: text };
  } catch (error) {
    console.error(`Error testing ${name}:`, error.message);
    return { error: error.message };
  }
}

async function runTests() {
  // Test logout
  await testEndpoint('Logout', `${baseUrl}/api/auth/logout`);
  
  // Test password reset request
  await testEndpoint('Password Reset Request', `${baseUrl}/api/auth/request-password-reset`, {
    body: JSON.stringify({ email: 'jumelisa@yahoo.com' })
  });
  
  // Test registration
  await testEndpoint('Registration', `${baseUrl}/api/auth/register`, {
    body: JSON.stringify({ 
      email: 'newuser@test.com', 
      password: 'testpass123', 
      company: 'Test Company' 
    })
  });
  
  // Test login
  await testEndpoint('Login', `${baseUrl}/api/auth/login`, {
    body: JSON.stringify({ 
      email: 'jumelisa@yahoo.com', 
      password: 'wrong_password' 
    })
  });
  
  console.log('\n=== Tests Complete ===');
}

runTests().catch(console.error);
