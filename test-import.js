// Test script for the CSV import function
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

console.log('🧪 Testing CSV import endpoint with missing vendors and categories...');
console.log('📋 Test data:', JSON.stringify(testData, null, 2));

// Use node-fetch or built-in fetch for Node.js 18+
const fetch = globalThis.fetch || require('node-fetch');

fetch('http://localhost:3000/api/import/materials', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    // Mock session cookie for auth
    'Cookie': 'connect.sid=s%3Atest-session.mock'
  },
  body: JSON.stringify(testData)
})
.then(response => {
  console.log(`📡 Response status: ${response.status}`);
  return response.json();
})
.then(data => {
  console.log('\n=== 📊 IMPORT TEST RESPONSE ===');
  console.log('📝 Message:', data.message);
  console.log('✅ Successful:', data.successful);
  console.log('❌ Failed:', data.failed);
  console.log('💡 Guidance:', data.guidance);
  console.log('📋 Action Steps:', data.actionSteps);
  console.log('🏪 Missing Vendors:', data.missingVendors);
  console.log('📂 Missing Categories:', data.missingCategories);
  console.log('⚠️  Errors (first 5):', data.errors?.slice(0, 5));
  
  if (data.guidance && data.actionSteps && data.missingVendors && data.missingCategories) {
    console.log('\n🎉 TEST PASSED: Response includes all expected guidance fields!');
  } else {
    console.log('\n❌ TEST FAILED: Missing expected response fields');
  }
})
.catch(error => {
  console.error('💥 Test failed:', error);
  console.log('\n🔧 Make sure the server is running: npm run dev');
});
