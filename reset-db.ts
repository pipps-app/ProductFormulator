import { db } from "./server/db.js";
import { users, vendors, materialCategories, rawMaterials, formulations, formulationIngredients, materialFiles, auditLog } from "./shared/schema.js";

async function resetDatabase() {
  try {
    console.log('Starting database reset...');
    
    // Delete all data in reverse order of dependencies
    await db.delete(auditLog);
    await db.delete(materialFiles);
    await db.delete(formulationIngredients);
    await db.delete(formulations);
    await db.delete(rawMaterials);
    await db.delete(materialCategories);
    await db.delete(vendors);
    await db.delete(users);
    
    console.log('✅ Database reset complete! All test data cleared.');
    console.log('Your app is now ready for production with clean data.');
    
  } catch (error) {
    console.error('❌ Error resetting database:', error);
  }
  
  process.exit(0);
}

resetDatabase();