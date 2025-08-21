import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq } from 'drizzle-orm';
import * as schema from '@shared/schema';

const connectionString = 'postgresql://postgres:postgres@localhost:5432/pipps_maker_calc';
const client = postgres(connectionString, {
  max: 5,
  idle_timeout: 10,
  connect_timeout: 5,
  prepare: false
});
const db = drizzle(client, { schema });

async function addVendorsAndCategories() {
  try {
    console.log('🔗 Connecting to database...');
    
    // Find the user jcepiphany@yahoo.com
    const users = await db.select().from(schema.users).where(eq(schema.users.email, 'jcepiphany@yahoo.com'));
    
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
        const existingVendor = await db.select()
          .from(schema.vendors)
          .where(eq(schema.vendors.name, vendorName))
          .where(eq(schema.vendors.userId, user.id));
        
        if (existingVendor.length === 0) {
          await db.insert(schema.vendors).values({
            name: vendorName,
            userId: user.id,
            createdAt: new Date()
          });
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
        const existingCategory = await db.select()
          .from(schema.materialCategories)
          .where(eq(schema.materialCategories.name, categoryName))
          .where(eq(schema.materialCategories.userId, user.id));
        
        if (existingCategory.length === 0) {
          await db.insert(schema.materialCategories).values({
            name: categoryName,
            userId: user.id,
            color: '#' + Math.floor(Math.random()*16777215).toString(16), // Random color
            createdAt: new Date()
          });
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
    await client.end();
  }
}

addVendorsAndCategories();
