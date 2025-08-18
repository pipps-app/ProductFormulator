// Final comprehensive test for the import endpoint
const BASE_URL = 'http://localhost:5000';

const testUser = {
  email: "test@example.com",
  password: "testpassword123",
  firstName: "Test",
  lastName: "User"
};

async function authenticateUser() {
  const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testUser.email,
      password: testUser.password
    })
  });

  if (!loginResponse.ok) {
    throw new Error(`Login failed: ${await loginResponse.text()}`);
  }

  return loginResponse.headers.get('set-cookie');
}

async function createTestVendor(sessionCookie, name) {
  const response = await fetch(`${BASE_URL}/api/vendors`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': sessionCookie || ''
    },
    body: JSON.stringify({
      name: name,
      contactEmail: `${name.toLowerCase()}@example.com`
    })
  });

  if (response.ok) {
    console.log(`✅ Created vendor: ${name}`);
  } else {
    console.log(`⚠️  Failed to create vendor ${name}: ${await response.text()}`);
  }
}

async function createTestCategory(sessionCookie, name) {
  const response = await fetch(`${BASE_URL}/api/material-categories`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': sessionCookie || ''
    },
    body: JSON.stringify({
      name: name,
      color: 'blue'
    })
  });

  if (response.ok) {
    console.log(`✅ Created category: ${name}`);
  } else {
    console.log(`⚠️  Failed to create category ${name}: ${await response.text()}`);
  }
}

async function runComprehensiveTest() {
  try {
    console.log('🔐 Authenticating...');
    const sessionCookie = await authenticateUser();

    // Test Case 1: Both vendors and categories missing (current state)
    console.log('\n=== TEST 1: Both vendors and categories missing ===');
    const testData1 = {
      materials: [
        {
          name: "Material A",
          categoryName: "MissingCat1",
          vendorName: "MissingVendor1",
          totalCost: "10",
          quantity: "1"
        }
      ]
    };

    const response1 = await fetch(`${BASE_URL}/api/import/materials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': sessionCookie || ''
      },
      body: JSON.stringify(testData1)
    });

    const result1 = await response1.json();
    console.log('Missing Vendors:', result1.missingVendors);
    console.log('Missing Categories:', result1.missingCategories);
    console.log('Errors:', result1.errors?.slice(0, 2));

    // Test Case 2: Create one vendor, test with missing category and existing vendor
    console.log('\n=== TEST 2: Creating one vendor, testing mixed scenario ===');
    await createTestVendor(sessionCookie, 'ExistingVendor');

    const testData2 = {
      materials: [
        {
          name: "Material B",
          categoryName: "MissingCat2", 
          vendorName: "ExistingVendor", // This exists
          totalCost: "15",
          quantity: "1"
        },
        {
          name: "Material C",
          categoryName: "MissingCat3",
          vendorName: "AnotherMissingVendor", // This doesn't exist
          totalCost: "20",
          quantity: "1"
        }
      ]
    };

    const response2 = await fetch(`${BASE_URL}/api/import/materials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': sessionCookie || ''
      },
      body: JSON.stringify(testData2)
    });

    const result2 = await response2.json();
    console.log('Missing Vendors:', result2.missingVendors);
    console.log('Missing Categories:', result2.missingCategories);
    console.log('Guidance:', result2.guidance);
    console.log('Action Steps:', result2.actionSteps);

    // Test Case 3: Create a category, test opposite scenario
    console.log('\n=== TEST 3: Creating one category, testing opposite scenario ===');
    await createTestCategory(sessionCookie, 'ExistingCategory');

    const testData3 = {
      materials: [
        {
          name: "Material D",
          categoryName: "ExistingCategory", // This exists
          vendorName: "YetAnotherMissingVendor", // This doesn't exist
          totalCost: "25",
          quantity: "1"
        }
      ]
    };

    const response3 = await fetch(`${BASE_URL}/api/import/materials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': sessionCookie || ''
      },
      body: JSON.stringify(testData3)
    });

    const result3 = await response3.json();
    console.log('Missing Vendors:', result3.missingVendors);
    console.log('Missing Categories:', result3.missingCategories);
    console.log('Guidance:', result3.guidance);

    // Final validation
    console.log('\n=== FINAL VALIDATION ===');
    const allTestsPassed = 
      (result1.missingCategories && result1.missingCategories.length > 0) &&
      (result2.missingVendors && result2.missingVendors.length > 0) &&
      (result2.missingCategories && result2.missingCategories.length > 0) &&
      (result3.missingVendors && result3.missingVendors.length > 0);

    if (allTestsPassed) {
      console.log('🎉 ALL TESTS PASSED! The missing vendors and categories extraction is working correctly.');
    } else {
      console.log('❌ Some tests failed. The logic needs more work.');
    }

  } catch (error) {
    console.error('Test failed:', error);
  }
}

runComprehensiveTest();
