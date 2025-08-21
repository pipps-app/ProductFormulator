import postgres from 'postgres';

async function removeHEC() {
  const sql = postgres('postgresql://postgres:postgres@localhost:5432/pipps_maker_calc');
  
  try {
    console.log('🔍 Looking for HEC raw material...');
    
    // Find the HEC material for jcepiphany user
    const materials = await sql`
      SELECT rm.id, rm.name, rm.category_id, rm.vendor_id, u.email
      FROM raw_materials rm
      JOIN users u ON rm.user_id = u.id
      WHERE u.email = 'jcepiphany@yahoo.com' AND rm.name = 'HEC'
    `;
    
    if (materials.length === 0) {
      console.log('❌ No HEC material found for jcepiphany@yahoo.com');
      return;
    }
    
    const material = materials[0];
    console.log(`✅ Found material: ${material.name} (ID: ${material.id})`);
    
    // Delete the HEC material
    const result = await sql`
      DELETE FROM raw_materials 
      WHERE id = ${material.id}
    `;
    
    console.log(`🗑️  Successfully deleted HEC material (ID: ${material.id})`);
    console.log('✅ Now you should be able to delete the Supplies category if needed');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sql.end();
  }
}

removeHEC();
