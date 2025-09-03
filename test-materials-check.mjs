import { db } from './server/database.js';
import { rawMaterials } from './server/schema.js';
import { ilike } from 'drizzle-orm';

async function checkMaterials() {
  try {
    console.log('🔍 Checking materials in database...');
    
    // Check for laminate materials specifically
    const laminateMaterials = await db.select().from(rawMaterials)
      .where(ilike(rawMaterials.name, '%laminate%'));
    
    console.log(`Found ${laminateMaterials.length} laminate materials:`);
    laminateMaterials.forEach(material => {
      console.log(`- ID: ${material.id}, Name: "${material.name}", Unit Cost: ${material.unitCost}, Active: ${material.isActive}`);
    });
    
    // Check total materials count
    const allMaterials = await db.select().from(rawMaterials);
    console.log(`\nTotal materials in database: ${allMaterials.length}`);
    
    // Show sample of materials
    console.log('\nSample materials (first 5):');
    const sample = allMaterials.slice(0, 5);
    sample.forEach(material => {
      console.log(`- "${material.name}" ($${material.unitCost}/${material.unit})`);
    });
    
    // Check for any materials with issues
    const problemMaterials = allMaterials.filter(m => !m.name || m.unitCost === null || !m.unit);
    console.log(`\nMaterials with potential issues: ${problemMaterials.length}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkMaterials();
