// Test script for the CSV import function with proper authentication
const BASE_URL = 'http://localhost:5000';

// Test data with missing vendors and categories
const testData = {
  materials: [
    {
      name: "Test Material 1",
      categoryName: "NonexistentCategory",
      vendorName: "NonexistentVendor",
      totalCost: "10",
      quantity: "2"
    },
    {
      name: "Test Material 2",
      categoryName: "AnotherMissingCategory", 
      vendorName: "AnotherMissingVendor",
      totalCost: "15",
      quantity: "3"
    }
  ]
};

// Test user credentials
const testUser = {
  email: "test@example.com",
  password: "testpassword123",
  firstName: "Test",
  lastName: "User"
};

async function registerAndLogin() {
  try {
    // Try to register user (might fail if already exists)
    console.log('📝 Registering test user...');
    const registerResponse = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser)
    });

    if (!registerResponse.ok && registerResponse.status !== 400) {
      const errorText = await registerResponse.text();
      console.log('⚠️  Registration response:', errorText);
      // Continue anyway, user might already exist
    }

    // Login to get session
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
      const errorText = await loginResponse.text();
      throw new Error(`Login failed: ${errorText}`);
    }

    // Extract session cookie
    const setCookieHeader = loginResponse.headers.get('set-cookie');
    console.log('✅ Login successful, got session cookie');
    return setCookieHeader;

  } catch (error) {
    console.error('❌ Authentication failed:', error.message);
    throw error;
  }
}

async function testImportEndpoint() {
  try {
    console.log('🧪 Testing CSV import endpoint with missing vendors and categories...');
    
    // First authenticate
    const sessionCookie = await registerAndLogin();
    
    console.log('📋 Test data:', JSON.stringify(testData, null, 2));

    const response = await fetch(`${BASE_URL}/api/import/materials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': sessionCookie || ''
      },
      body: JSON.stringify(testData)
    });

    console.log(`📡 Response status: ${response.status}`);
    
    const data = await response.json();
    
    console.log('\n=== 📊 IMPORT TEST RESPONSE ===');
    console.log('📝 Message:', data.message);
    console.log('✅ Successful:', data.successful);
    console.log('❌ Failed:', data.failed);
    console.log('💡 Guidance:', data.guidance);
    console.log('📋 Action Steps:', data.actionSteps);
    console.log('🏪 Missing Vendors:', data.missingVendors);
    console.log('📂 Missing Categories:', data.missingCategories);
    console.log('⚠️  Errors (first 5):', data.errors?.slice(0, 5));
    
    // Validation
    const expectedFields = ['guidance', 'actionSteps', 'missingVendors', 'missingCategories'];
    const missingFields = expectedFields.filter(field => !data.hasOwnProperty(field));
    
    if (missingFields.length === 0) {
      console.log('\n🎉 TEST PASSED: Response includes all expected guidance fields!');
      
      // Additional checks
      if (Array.isArray(data.missingVendors) && data.missingVendors.length > 0) {
        console.log('✅ Missing vendors array is populated correctly');
      }
      if (Array.isArray(data.missingCategories) && data.missingCategories.length > 0) {
        console.log('✅ Missing categories array is populated correctly');
      }
      if (data.guidance && data.guidance.length > 0) {
        console.log('✅ Guidance text is provided');
      }
      if (Array.isArray(data.actionSteps) && data.actionSteps.length > 0) {
        console.log('✅ Action steps are provided');
      }
    } else {
      console.log(`\n❌ TEST FAILED: Missing expected response fields: ${missingFields.join(', ')}`);
    }
    
  } catch (error) {
    console.error('💥 Test failed:', error);
    console.log('\n🔧 Make sure the server is running: npm run dev');
  }
}

// Run the test
testImportEndpoint();
