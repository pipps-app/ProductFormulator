// Browser Console Test Script for Material Operations
// Copy and paste this into the browser console while logged into the app

(async function testMaterialOperations() {
  console.log('🧪 Testing Material Operations...');
  
  // Check if user is authenticated
  const token = localStorage.getItem('auth_token');
  if (!token) {
    console.error('❌ No auth token found. Please login first.');
    return;
  }
  
  console.log('✅ Auth token found');
  
  try {
    // Test GET materials
    console.log('\n📋 Testing GET materials...');
    const response = await fetch('/api/raw-materials', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.ok) {
      const materials = await response.json();
      console.log(`✅ Found ${materials.length} materials`);
      if (materials.length > 0) {
        console.log('First material:', materials[0]);
      }
    } else {
      console.error('❌ GET failed:', response.status, await response.text());
      return;
    }
    
    // Test POST (create material)
    console.log('\n➕ Testing POST (create material)...');
    const testMaterial = {
      name: `Test Material ${Date.now()}`,
      totalCost: '25.50',
      quantity: '500',
      unit: 'g',
      notes: 'Browser console test'
    };
    
    const createResponse = await fetch('/api/raw-materials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(testMaterial)
    });
    
    if (createResponse.ok) {
      const created = await createResponse.json();
      console.log('✅ Material created:', created);
      
      // Test PUT (update material)
      console.log('\n✏️ Testing PUT (update material)...');
      const updateData = {
        name: created.name + ' (Updated)',
        totalCost: '30.00'
      };
      
      const updateResponse = await fetch(`/api/raw-materials/${created.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });
      
      if (updateResponse.ok) {
        const updated = await updateResponse.json();
        console.log('✅ Material updated:', updated);
      } else {
        console.error('❌ PUT failed:', updateResponse.status, await updateResponse.text());
      }
      
      // Test DELETE
      console.log('\n🗑️ Testing DELETE...');
      const deleteResponse = await fetch(`/api/raw-materials/${created.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (deleteResponse.ok) {
        const deleteResult = await deleteResponse.json();
        console.log('✅ Material deleted:', deleteResult);
      } else {
        console.error('❌ DELETE failed:', deleteResponse.status, await deleteResponse.text());
      }
      
    } else {
      console.error('❌ POST failed:', createResponse.status, await createResponse.text());
    }
    
    console.log('\n🎉 Material operation testing completed!');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
})();
