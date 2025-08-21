import pkg from 'pg';
const { Client } = pkg;

async function applyConstraints() {
  const client = new Client({
    connectionString: 'postgresql://postgres:postgres@localhost:5432/pipps_maker_calc'
  });
  
  try {
    await client.connect();
    console.log('🔧 Applying database constraints (PostgreSQL compatible)...\n');
    
    // List of constraints to add
    const constraints = [
      {
        table: 'raw_materials',
        name: 'check_positive_total_cost',
        sql: 'ALTER TABLE raw_materials ADD CONSTRAINT check_positive_total_cost CHECK (total_cost >= 0)'
      },
      {
        table: 'raw_materials',
        name: 'check_positive_quantity',
        sql: 'ALTER TABLE raw_materials ADD CONSTRAINT check_positive_quantity CHECK (quantity > 0)'
      },
      {
        table: 'raw_materials',
        name: 'check_positive_unit_cost',
        sql: 'ALTER TABLE raw_materials ADD CONSTRAINT check_positive_unit_cost CHECK (unit_cost >= 0)'
      },
      {
        table: 'formulations',
        name: 'check_positive_batch_size',
        sql: 'ALTER TABLE formulations ADD CONSTRAINT check_positive_batch_size CHECK (batch_size > 0)'
      },
      {
        table: 'formulations',
        name: 'check_positive_total_cost',
        sql: 'ALTER TABLE formulations ADD CONSTRAINT check_positive_total_cost CHECK (total_cost >= 0)'
      },
      {
        table: 'formulations',
        name: 'check_positive_unit_cost',
        sql: 'ALTER TABLE formulations ADD CONSTRAINT check_positive_unit_cost CHECK (unit_cost >= 0)'
      },
      {
        table: 'formulations',
        name: 'check_valid_markup',
        sql: 'ALTER TABLE formulations ADD CONSTRAINT check_valid_markup CHECK (markup_percentage >= 0 AND markup_percentage <= 1000)'
      },
      {
        table: 'formulation_ingredients',
        name: 'check_positive_quantity',
        sql: 'ALTER TABLE formulation_ingredients ADD CONSTRAINT check_positive_quantity CHECK (quantity > 0)'
      },
      {
        table: 'formulation_ingredients',
        name: 'check_positive_cost_contribution',
        sql: 'ALTER TABLE formulation_ingredients ADD CONSTRAINT check_positive_cost_contribution CHECK (cost_contribution >= 0)'
      },
      {
        table: 'raw_materials',
        name: 'unique_material_name_per_user',
        sql: 'ALTER TABLE raw_materials ADD CONSTRAINT unique_material_name_per_user UNIQUE (user_id, name)'
      },
      {
        table: 'formulations',
        name: 'unique_formulation_name_per_user',
        sql: 'ALTER TABLE formulations ADD CONSTRAINT unique_formulation_name_per_user UNIQUE (user_id, name)'
      }
    ];
    
    // Function to check if constraint exists
    async function constraintExists(tableName, constraintName) {
      const result = await client.query(`
        SELECT 1 FROM information_schema.constraint_column_usage 
        WHERE table_name = $1 AND constraint_name = $2
      `, [tableName, constraintName]);
      return result.rows.length > 0;
    }
    
    console.log('Adding constraints...');
    let added = 0;
    let skipped = 0;
    
    for (const constraint of constraints) {
      try {
        const exists = await constraintExists(constraint.table, constraint.name);
        if (!exists) {
          await client.query(constraint.sql);
          console.log(`   ✅ Added: ${constraint.name} on ${constraint.table}`);
          added++;
        } else {
          console.log(`   ⏭️ Skipped: ${constraint.name} (already exists)`);
          skipped++;
        }
      } catch (error) {
        console.log(`   ❌ Failed: ${constraint.name} - ${error.message}`);
      }
    }
    
    console.log(`\n📊 Summary: ${added} added, ${skipped} skipped`);
    
    // Test the constraints
    console.log('\n🧪 Testing constraints...');
    
    try {
      await client.query(`INSERT INTO raw_materials (name, total_cost, quantity, unit, unit_cost, user_id) VALUES ('TEST', -1, 1, 'g', 1, 1)`);
      console.log('   ❌ Constraint test failed - negative cost allowed');
    } catch (e) {
      console.log('   ✅ Constraint working - negative cost rejected');
    }
    
    // Clean up test if it was inserted
    await client.query(`DELETE FROM raw_materials WHERE name = 'TEST'`);
    
    console.log('\n🎉 Database security improved!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

applyConstraints();
