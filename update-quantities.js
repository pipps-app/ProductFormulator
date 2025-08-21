import pkg from 'pg';
const { Client } = pkg;

async function updateQuantities() {
  const client = new Client({
    connectionString: 'postgresql://postgres:postgres@localhost:5432/pipps_maker_calc'
  });
  
  try {
    await client.connect();
    console.log('=== UPDATING FORMULATION QUANTITIES ===\n');
    
    // First check current values
    console.log('Current formulation ingredients:');
    const current = await client.query(`
      SELECT fi.*, rm.name as material_name, rm.unit_cost 
      FROM formulation_ingredients fi 
      JOIN raw_materials rm ON fi.material_id = rm.id 
      WHERE fi.formulation_id = 12
    `);
    
    current.rows.forEach(ing => {
      console.log(`- ${ing.material_name}: ${ing.quantity} ${ing.unit} @ $${ing.unit_cost}/${ing.unit}`);
      console.log(`  Current cost contribution: $${ing.cost_contribution}`);
    });
    
    // Update to a more realistic quantity (e.g., 30g instead of 0.124g)
    const newQuantity = 30.0;
    
    console.log(`\nUpdating quantity to ${newQuantity}g...`);
    
    // Update the quantity in formulation_ingredients
    await client.query(`
      UPDATE formulation_ingredients 
      SET quantity = $1, 
          cost_contribution = (SELECT unit_cost FROM raw_materials WHERE id = material_id) * $1
      WHERE formulation_id = 12
    `, [newQuantity]);
    
    console.log('✅ Updated formulation ingredient quantities');
    
    // Check updated values
    console.log('\nUpdated formulation ingredients:');
    const updated = await client.query(`
      SELECT fi.*, rm.name as material_name, rm.unit_cost 
      FROM formulation_ingredients fi 
      JOIN raw_materials rm ON fi.material_id = rm.id 
      WHERE fi.formulation_id = 12
    `);
    
    updated.rows.forEach(ing => {
      console.log(`- ${ing.material_name}: ${ing.quantity} ${ing.unit} @ $${ing.unit_cost}/${ing.unit}`);
      console.log(`  New cost contribution: $${ing.cost_contribution}`);
    });
    
  } catch(e) { 
    console.error('Error:', e.message); 
  } finally { 
    await client.end(); 
  }
}

updateQuantities();
