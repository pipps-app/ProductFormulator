import pg from 'pg';
const { Pool } = pg;

async function resetDatabase() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    console.log('Starting database reset...');
    
    // Delete all data in reverse order of dependencies
    await pool.query('DELETE FROM audit_log');
    await pool.query('DELETE FROM material_files');
    await pool.query('DELETE FROM formulation_ingredients');
    await pool.query('DELETE FROM formulations');
    await pool.query('DELETE FROM raw_materials');
    await pool.query('DELETE FROM material_categories');
    await pool.query('DELETE FROM vendors');
    await pool.query('DELETE FROM users');
    
    // Reset sequences to start from 1
    await pool.query('ALTER SEQUENCE users_id_seq RESTART WITH 1');
    await pool.query('ALTER SEQUENCE vendors_id_seq RESTART WITH 1');
    await pool.query('ALTER SEQUENCE material_categories_id_seq RESTART WITH 1');
    await pool.query('ALTER SEQUENCE raw_materials_id_seq RESTART WITH 1');
    await pool.query('ALTER SEQUENCE formulations_id_seq RESTART WITH 1');
    await pool.query('ALTER SEQUENCE formulation_ingredients_id_seq RESTART WITH 1');
    await pool.query('ALTER SEQUENCE material_files_id_seq RESTART WITH 1');
    await pool.query('ALTER SEQUENCE audit_log_id_seq RESTART WITH 1');
    
    console.log('✅ Database reset complete! All test data cleared.');
    console.log('Your app is now ready for production with clean data.');
    
  } catch (error) {
    console.error('❌ Error resetting database:', error);
  } finally {
    await pool.end();
  }
}

resetDatabase();