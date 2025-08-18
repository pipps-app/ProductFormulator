import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import csv from 'csv-parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputFilePath = path.join(__dirname, 'cleaned_raw_materials.csv');

const categories = new Set();
const vendors = new Set();

fs.createReadStream(inputFilePath)
  .pipe(csv())
  .on('data', (row) => {
    if (row.categoryName) {
      categories.add(row.categoryName);
    }
    if (row.vendorName) {
      vendors.add(row.vendorName);
    }
  })
  .on('end', () => {
    console.log('=== CATEGORIES TO CREATE ===');
    const sortedCategories = Array.from(categories).sort();
    sortedCategories.forEach((category, index) => {
      console.log(`${index + 1}. ${category}`);
    });
    
    console.log('\n=== VENDORS TO CREATE ===');
    const sortedVendors = Array.from(vendors).sort();
    sortedVendors.forEach((vendor, index) => {
      console.log(`${index + 1}. ${vendor}`);
    });
    
    console.log('\n=== SUMMARY ===');
    console.log(`Total categories to create: ${categories.size}`);
    console.log(`Total vendors to create: ${vendors.size}`);
    
    console.log('\n=== INSTRUCTIONS ===');
    console.log('1. Go to your web app');
    console.log('2. Create all the CATEGORIES listed above first');
    console.log('3. Create all the VENDORS listed above');
    console.log('4. Then try importing the cleaned_raw_materials.csv file again');
  });
