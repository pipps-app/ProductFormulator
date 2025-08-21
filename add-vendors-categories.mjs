import postgres from 'postgres';

async function addVendorsAndCategories() {
  const connectionString = 'postgresql://postgres:postgres@localhost:5432/pipps_maker_calc';
  const sql = postgres(connectionString);
  
  try {
    console.log('🔗 Connecting to database...');
    
    // Find the user jcepiphany@yahoo.com
    const users = await sql`SELECT id, email FROM users WHERE email = 'jcepiphany@yahoo.com'`;
    
    if (users.length === 0) {
      console.log('❌ User jcepiphany@yahoo.com not found');
      return;
    }
    
    const user = users[0];
    console.log(`✅ Found user: ${user.email} (ID: ${user.id})`);
    
    // Define vendors and categories from the CSV
    const vendors = [
      'Paramount Trading',
      'Supermarket',
      'Poly pet',
      'United Plastics',
      'Versachem',
      'Jamaica Packaging',
      'Hardware store',
      'Piedmont trading',
      'Online purchase',
      'Changs trading',
      'Grove Industries',
      'Post Office',
      'Earth Elements',
      'Pricesmart',
      'Caribbean producers'
    ];

    const categories = [
      'Additives',
      'Bottles',
      'boxes',
      'concrete supplies',
      'Essential/Fragrance Oils',
      'Packaging',
      'Rapid Grow Products',
      'Shipping',
      'Soap Making Ingredients',
      'Soap Oils'
    ];

    console.log(`📊 Adding ${vendors.length} vendors and ${categories.length} categories`);

    // Add vendors
    console.log('\n📦 Adding vendors...');
    let vendorCount = 0;
    for (const vendorName of vendors) {
      try {
        // Check if vendor already exists for this user
        const existingVendor = await sql`
          SELECT id FROM vendors 
          WHERE name = ${vendorName} AND user_id = ${user.id}
        `;
        
        if (existingVendor.length === 0) {
          await sql`
            INSERT INTO vendors (name, user_id, created_at) 
            VALUES (${vendorName}, ${user.id}, NOW())
          `;
          console.log(`✅ Added vendor: ${vendorName}`);
          vendorCount++;
        } else {
          console.log(`⏭️  Vendor already exists: ${vendorName}`);
        }
      } catch (error) {
        console.log(`❌ Error adding vendor ${vendorName}:`, error.message);
      }
    }

    // Add categories
    console.log('\n🏷️  Adding categories...');
    let categoryCount = 0;
    for (const categoryName of categories) {
      try {
        // Check if category already exists for this user
        const existingCategory = await sql`
          SELECT id FROM material_categories 
          WHERE name = ${categoryName} AND user_id = ${user.id}
        `;
        
        if (existingCategory.length === 0) {
          const randomColor = '#' + Math.floor(Math.random()*16777215).toString(16);
          await sql`
            INSERT INTO material_categories (name, user_id, color) 
            VALUES (${categoryName}, ${user.id}, ${randomColor})
          `;
          console.log(`✅ Added category: ${categoryName}`);
          categoryCount++;
        } else {
          console.log(`⏭️  Category already exists: ${categoryName}`);
        }
      } catch (error) {
        console.log(`❌ Error adding category ${categoryName}:`, error.message);
      }
    }

    console.log(`\n🎉 Successfully added ${vendorCount} vendors and ${categoryCount} categories for ${user.email}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sql.end();
  }
}

addVendorsAndCategories();
