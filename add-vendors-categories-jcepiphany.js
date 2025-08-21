import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq, and } from 'drizzle-orm';
import * as schema from './shared/schema.ts';

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
    
    // Extract vendors and categories from CSV data
    const csvData = `name,sku,categoryName,vendorName,totalCost,quantity,unit,notes
Citric Acid,,Additives,Paramount Trading,9500,25000,g,Paramount - $9500 per 25000g
Mineral Oil,,Additives,Paramount Trading,17200,18925,g,CHECK !!! Paramount - $17200 per 5 gallon - 18925
Water (purified),,Additives,Supermarket,700,19000,g,Catherine Peak 700 per 19000mls
Bottle caps 24-410 (UP),,Bottles,Poly pet ,7.59,1,pcs,used for 8oz and 16oz bottles
Gallon bottles and caps F-style clear,,Bottles,United Plastics,"3,400.00",24.00,pcs,
Gallon bottles and caps white round,,Bottles,United Plastics,"2,600.00",24.00,pcs,
Half Gallon bottles - clear ,,Bottles,United Plastics,127,1,pcs,
Half Gallon bottles - white,,Bottles,United Plastics,127,1,pcs,
Quart bottles - clear,,Bottles,United Plastics,127,1,pcs,
Quart bottles - white,,Bottles,United Plastics,127,1,pcs,
Bottle caps 24-410 (VERS),,Bottles,Versachem,10.9135,1,pcs,use for verschem 8oz and 16oz bottles
bottles - 4oz white,,Bottles,Versachem,50,1,pcs,
bottles - trigger spray bottle white 22oz,,Bottles,Versachem,13000.75,250,pcs,purchase approx. 5 bags of 250's in 2022
Bottles 16 oz clear,,Bottles,Versachem,11500,300,pcs,
Bottles 8oz white,,Bottles,Versachem,15525.9775,600,pcs,use Versachems 24-410 whien pricing
Gallon bottles and caps natural round,,Bottles,Versachem,"2,600.00",24.00,pcs,price estimated from 2022 with inflation
Trigger sprayers,,Bottles,Versachem,55.2,1,pcs,
Boxes - 279mm x 187mm x 103mm,,boxes,Jamaica Packaging,100.05,1,pcs,"called 'spice jar carton' ; 11"" x 7"" x 4"" ; used for small orders eg soap 8oz 16oz, paperclip holders, etc "
Boxes - 305mm x 203mm x 160mm,,boxes,Jamaica Packaging,143.75,1,pcs,"called 'Jamaica cosmetics' ; 12"" x 8"" x 6"" ; "
Boxes - 330mm x 229mm x 171mm ,,boxes,Jamaica Packaging,165.6,1,pcs,"called 'bacon' ; 13"" x 9"" x 6.7""; medium size box"
Boxes - 344mm x 230mm x149 mm,,boxes,Jamaica Packaging,133.4,1,pcs,"called - '24 x 240mls' ; medium size box; 13.5"" x 9"" x 5.8"""
Boxes - 400mm x 268mm x191 mm,,boxes,Jamaica Packaging,141.45,1,pcs,"called 'corrugated case 24 x 16oz'; '16oz x24' printed on box; 15.7"" x 10.5"" x 7.5""; large box"
"Boxes - cube 9"" x 9"" x 9""",,boxes,Jamaica Packaging,3004,25,pcs,"Used for bookends x 2, coasters x4, etc."
"Boxes - Mailer - small 9"" x 6"" x 4""",,boxes,Jamaica Packaging,139.15,1,pcs,box with flaps - not used often
Boxes - slip sheet,,boxes,Jamaica Packaging,1245,10,pcs,Used for lining boxes - divided by 10 to account for usage
Cement - grey 40kg bag,,concrete supplies,Hardware store,2500,40000,,42.4 kg = 40000g
Cement - white 40kg bag,,concrete supplies,Hardware store,4400,40000,g,
Sand,,concrete supplies,Hardware store,700,90000,g,approx 200 pound bag = 90000g
oxides - black,,concrete supplies,Piedmont trading,21000,24000,,for 55lbs = 24000g
oxides - blue,,concrete supplies,Piedmont trading,1000,454,,estimated 
oxides - green,,concrete supplies,Piedmont trading,25000,24000,,for 55lbs = 24000g
oxides - red,,concrete supplies,Piedmont trading,21000,24000,,for 55lbs = 24000g
oxides - yellow,,concrete supplies,Piedmont trading,18000,19000,,for 44lbs = 19000g
eucalyptus,,Essential/Fragrance Oils,Online purchase,18.67,102.00,g,
Fragrance oils - Plant guru,,Essential/Fragrance Oils,Online purchase,9420,828,g,"4oz bottle - $12 USD each, pay for 4 = $48, get 7; total 7 x 4 oz = 828mls; mail pack = $1500"
lavender,,Essential/Fragrance Oils,Online purchase,"4,895.55",102.00,g,
lemon,,Essential/Fragrance Oils,Online purchase,"3,410.55",102.00,g,
lemongrass,,Essential/Fragrance Oils,Online purchase,"4,070.55",102.00,g,
orange,,Essential/Fragrance Oils,Online purchase,"3,080.55",102.00,g,
peppermint,,Essential/Fragrance Oils,Online purchase,"3,905.55",102.00,g,
rosemary,,Essential/Fragrance Oils,Online purchase,"4,400.55",102.00,g,
tto,,Essential/Fragrance Oils,Online purchase,"4,070.55",102.00,g,
"Bags - clear plastic 10"" x 20"" ",,Packaging,Changs trading,5.4,1,pcs,use to bag gallon bottles
"Bags - clear plastic 3"" x 7""",,Packaging,Changs trading,0.5635,1,pcs,used to bag 4oz bottles.
"Bags - clear plastic 5"" x 8""",,Packaging,Changs trading,0.8395,1,pcs,"used to bag 8oz bottles, etc"
"Bags - clear plastic 7' x 12""",,Packaging,Changs trading,1.61,1,pcs,
"Bags - clear plastic 9"" x 14""",,Packaging,Changs trading,2.8865,1,pcs,
Bags - paper 6 lbs,,Packaging,Changs trading,8.533,1,pcs,medium size brown bags
"Bags - plastic ziplock 8"" x 8""",,Packaging,Changs trading,15.4675,1,pcs,
Twist ties,,Packaging,Changs trading,327.75,1000,pcs,
"Brown paper roll 36"" (local)",,Packaging,Grove Industries,9500,900,pcs,300y yard roll = 900 feet; divide units into 1 foot pieces 
Crack and peel paper,,Packaging,Online purchase,7940,500,pcs,$5600 plus gct plus $1500 cutting fee for 500 sheets plus $300/4 copy fee
Epsom Salt,,Rapid Grow Products,Supermarket,500,454,,
Fish Head,,Rapid Grow Products,Supermarket,250,454,,cost - 1lb =454g = $250
Garlic,,Rapid Grow Products,Supermarket,2,1,g,$700 per lb (454g) approx $2 per gram
Molasses,,Rapid Grow Products,Supermarket,600,1000,g,
Onion ,,Rapid Grow Products,Supermarket,1,1,g,$500 per pound (454g) approx $1 per gram
Scotch bonnet pepper,,Rapid Grow Products,Supermarket,1,1,g,$500 per pound (454g) approx $1 per gram
Seaweed,,Rapid Grow Products,Supermarket,0.6,1,ml,cost calculated after collecting and processing 
Shipping - Airmail up to 500g,,Shipping,Post Office,250,1,pcs,
Shipping - Airmail up to 1kg,,Shipping,Post Office,500,1,pcs,
Shipping - Airmail up to 1.5kg,,Shipping,Post Office,750,1,pcs,
Shipping - Airmail up to 2kg,,Shipping,Post Office,1000,1,pcs,
Shipping - Airmail up to 2.5kg,,Shipping,Post Office,1250,1,pcs,
Shipping - Airmail up to 3kg,,Shipping,Post Office,1500,1,pcs,
Shipping - Airmail up to 3.5kg,,Shipping,Post Office,1750,1,pcs,
Shipping - SAL - USA up to 3kg,,Shipping,Post Office,860,1,pcs,
Shipping - SAL - USA up to 5kg,,Shipping,Post Office,1300,1,pcs,
Shipping - SAL - USA up to 10kg,,Shipping,Post Office,2340,1,pcs,
charcoal powder per gram,,Soap Making Ingredients,Earth Elements,2000,116,g,Earth element -4 oz (116g) = $1600; 1T weighs 5g
Bentonite clay per gram,,Soap Making Ingredients,Online purchase,3675,454,g,aztec clay mask - 1 lbs =454g =$15USD plus $1200 JMD courier
Glycerin per ml,,Soap Making Ingredients,Paramount Trading,22000,19000,g,Paramount - $22000 per 19000mls
HEC - Cellulose,,Soap Making Ingredients,Paramount Trading,77100,25000,g,Cellulose - paramount $77000 / 25000g purchased Feb 9 2024
Potassium hydroxide,,Soap Making Ingredients,Paramount Trading,41000,25000,g,Paramount Trading
Sodium hydroxide,,Soap Making Ingredients,Paramount Trading,6800,25000,g,Paramount Trading
coconut milk powder,,Soap Making Ingredients,Pricesmart,1600,600,g,Pricesmart - $1600 for 50g x 12 packs
Salt,,Soap Making Ingredients,Pricesmart,300,2000,g,Pricesmart -$300 for 2 kg
Sugar,,Soap Making Ingredients,Supermarket,1500,3000,g,Pricesmart $1500 for 3kg
glydant,,Soap Making Ingredients,Versachem,8000,1000,g,$8000 for 1000g - $8 per gram. Usage 0.0075%
Palm oil,,Soap Oils,Caribbean producers,6500,16150,g,"$6000/16000mls i.e weight = 85% volume 18.8, Seprod / Caribbean products"
almond oil - USD plus courier,,Soap Oils,Online purchase,10930,3217.25,g,$42 USD for 1 gallon plus $4000 JMD courier
Castor oil,,Soap Oils,Online purchase,10930,3217.25,g,$42 USD per gallon plus $4000 courier
jojoba oil - USD plus courier,,Soap Oils,Online purchase,6950,788.8,g,$30 USD for 32 fl. oz plus $2000 JMD  courier
neem oil 64 fl. oz - USD plus courier,,Soap Oils,Online purchase,10764,1670.4,g,
ROE,,Soap Oils,Online purchase,8000,204,g,$44 US + 6 US courier = $50; $9000JA / 240mls
Coconut Oil,,Soap Oils,Pricesmart,4700,3400,g,Pricesmart - $4500 / 3400mls i.e weight = 85% volume 4L
Sunflower Oil;,,Soap Oils,Pricesmart,3000,4250,g,Pricesmart $3000/ 4250mls i.e weight = 85% volume 5L
Olive oil,,Soap Oils,Supermarket,7300,3400,g,Hi -Lo - O.O pomace - $7300`;

    // Parse CSV data
    const vendors = new Set();
    const categories = new Set();
    
    const rows = csvData.split('\n').slice(1); // Skip header
    rows.forEach(row => {
      const columns = row.split(',');
      if (columns.length >= 4) {
        const categoryName = columns[2]?.trim();
        const vendorName = columns[3]?.trim();
        
        if (categoryName) categories.add(categoryName);
        if (vendorName) vendors.add(vendorName);
      }
    });

    console.log(`📊 Found ${vendors.size} unique vendors and ${categories.size} unique categories`);

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
