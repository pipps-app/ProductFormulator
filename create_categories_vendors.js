import fetch from 'node-fetch';

const categoriesToCreate = [
  'Additives',
  'Bottles', 
  'Essential/Fragrance Oils',
  'Packaging',
  'Rapid Grow Products',
  'Shipping',
  'Soap Making Ingredients',
  'Soap Oils',
  'boxes',
  'concrete supplies'
];

const vendorsToCreate = [
  'Caribbean producers',
  'Changs trading',
  'Earth Elements',
  'Grove Industries',
  'Hardware store',
  'Jamaica Packaging',
  'Online purchase',
  'Paramount Trading',
  'Piedmont trading',
  'Poly pet',
  'Post Office',
  'Pricesmart',
  'Supermarket',
  'United Plastics',
  'Versachem'
];

// Use my API base URL: http://localhost:5000 (or change if needed)
const API_BASE_URL = 'http://localhost:5000';

// Add Authorization headers with a bearer token: Authorization: Bearer YOUR_API_TOKEN_HERE
const headers = {
  'Content-Type': 'application/json',
  // 'Authorization': 'Bearer YOUR_API_TOKEN_HERE'  // Uncomment and add token if needed
};

async function createCategory(category) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/material-categories`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ name: category })
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log(`✅ Category created: ${category}`);
      return { success: true, category, status: response.status };
    } else {
      console.log(`❌ Category failed: ${category} - ${result.error || 'Unknown error'}`);
      return { success: false, category, error: result.error, status: response.status };
    }
  } catch (error) {
    console.log(`❌ Category error: ${category} - ${error.message}`);
    return { success: false, category, error: error.message };
  }
}

async function createVendor(vendor) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/vendors`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ name: vendor })
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log(`✅ Vendor created: ${vendor}`);
      return { success: true, vendor, status: response.status };
    } else {
      console.log(`❌ Vendor failed: ${vendor} - ${result.error || 'Unknown error'}`);
      return { success: false, vendor, error: result.error, status: response.status };
    }
  } catch (error) {
    console.log(`❌ Vendor error: ${vendor} - ${error.message}`);
    return { success: false, vendor, error: error.message };
  }
}

async function retryOperation(operation, maxRetries = 2) {
  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    const result = await operation();
    if (result.success) {
      return result;
    }
    
    if (attempt <= maxRetries) {
      console.log(`🔄 Retrying (${attempt}/${maxRetries})...`);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
    }
  }
  
  return operation(); // Return final attempt result
}

async function main() {
  console.log('🚀 Starting bulk creation of categories and vendors...\n');
  
  const categoryResults = [];
  const vendorResults = [];
  
  // Create categories
  console.log('📁 Creating categories...');
  for (const category of categoriesToCreate) {
    const result = await retryOperation(() => createCategory(category));
    categoryResults.push(result);
  }
  
  console.log('\n🏢 Creating vendors...');
  for (const vendor of vendorsToCreate) {
    const result = await retryOperation(() => createVendor(vendor));
    vendorResults.push(result);
  }
  
  // Log successful and failed API calls with category/vendor name and HTTP status
  console.log('\n📊 SUMMARY REPORT:');
  
  const successfulCategories = categoryResults.filter(r => r.success);
  const failedCategories = categoryResults.filter(r => !r.success);
  
  const successfulVendors = vendorResults.filter(r => r.success);
  const failedVendors = vendorResults.filter(r => !r.success);
  
  console.log(`✅ Categories created: ${successfulCategories.length}/${categoriesToCreate.length}`);
  successfulCategories.forEach(r => console.log(`   - ${r.category} (HTTP ${r.status})`));
  
  if (failedCategories.length > 0) {
    console.log(`❌ Categories failed: ${failedCategories.length}`);
    failedCategories.forEach(r => console.log(`   - ${r.category} (HTTP ${r.status || 'N/A'}) - ${r.error}`));
  }
  
  console.log(`✅ Vendors created: ${successfulVendors.length}/${vendorsToCreate.length}`);
  successfulVendors.forEach(r => console.log(`   - ${r.vendor} (HTTP ${r.status})`));
  
  if (failedVendors.length > 0) {
    console.log(`❌ Vendors failed: ${failedVendors.length}`);
    failedVendors.forEach(r => console.log(`   - ${r.vendor} (HTTP ${r.status || 'N/A'}) - ${r.error}`));
  }
  
  console.log('\n🎉 All done!');
}

main().catch(console.error);
