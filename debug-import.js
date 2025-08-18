// Script to clear all data and set up a clean test
const BASE_URL = 'http://localhost:5000';

// Test user credentials
const testUser = {
  email: "test@example.com",
  password: "testpassword123",
  firstName: "Test", 
  lastName: "User"
};

async function authenticateUser() {
  try {
    console.log('🔐 Logging in...');
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password
      })
    });

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${await loginResponse.text()}`);
    }

    const setCookieHeader = loginResponse.headers.get('set-cookie');
    console.log('✅ Login successful');
    return setCookieHeader;
  } catch (error) {
    console.error('❌ Authentication failed:', error.message);
    throw error;
  }
}

async function checkCurrentData() {
  try {
    const sessionCookie = await authenticateUser();
    
    // Check current vendors
    const vendorsResponse = await fetch(`${BASE_URL}/api/vendors`, {
      headers: { 'Cookie': sessionCookie || '' }
    });
    const vendors = await vendorsResponse.json();
    console.log('Current vendors:', vendors.map(v => v.name));
    
    // Check current categories
    const categoriesResponse = await fetch(`${BASE_URL}/api/material-categories`, {
      headers: { 'Cookie': sessionCookie || '' }
    });
    const categories = await categoriesResponse.json();
    console.log('Current categories:', categories.map(c => c.name));
    
    return { sessionCookie, vendors, categories };
  } catch (error) {
    console.error('Error checking data:', error);
    throw error;
  }
}

async function runImportTest() {
  try {
    const { sessionCookie } = await checkCurrentData();
    
    // Test with data that has both missing vendors AND categories
    const testData = {
      materials: [
        {
          name: "Test Material 1",
          categoryName: "MissingCategory1",
          vendorName: "MissingVendor1", 
          totalCost: "10",
          quantity: "2"
        },
        {
          name: "Test Material 2",
          categoryName: "MissingCategory2",
          vendorName: "MissingVendor2",
          totalCost: "15", 
          quantity: "3"
        }
      ]
    };
    
    console.log('\n🧪 Testing import with missing data...');
    const response = await fetch(`${BASE_URL}/api/import/materials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': sessionCookie || ''
      },
      body: JSON.stringify(testData)
    });
    
    const result = await response.json();
    console.log('\n=== IMPORT RESULT ===');
    console.log('Message:', result.message);
    console.log('Failed:', result.failed);
    console.log('Missing Vendors:', result.missingVendors);
    console.log('Missing Categories:', result.missingCategories);
    console.log('Guidance:', result.guidance);
    console.log('Action Steps:', result.actionSteps);
    console.log('Errors (first 3):', result.errors?.slice(0, 3));
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

runImportTest();
