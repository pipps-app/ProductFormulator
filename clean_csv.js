import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import csv from 'csv-parser';
import { stringify } from 'csv-stringify';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputFilePath = path.join(__dirname, 'maker calc raw materials - soap_cost_prices.csv');
const outputFilePath = path.join(__dirname, 'cleaned_raw_materials.csv');

const requiredHeaders = ['name', 'sku', 'categoryName', 'vendorName', 'totalCost', 'quantity', 'unit', 'notes'];

const cleanedData = [];

fs.createReadStream(inputFilePath)
  .pipe(csv())
  .on('headers', (headers) => {
    const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));
    if (missingHeaders.length > 0) {
      console.error(`Missing required headers: ${missingHeaders.join(', ')}`);
      process.exit(1);
    }
  })
  .on('data', (row) => {
    let corrected = false;

    // Fill missing unit fields
    if (!row.unit) {
      row.unit = 'unit';
      corrected = true;
    }

    // Standardize numeric formats
    if (row.totalCost) {
      row.totalCost = row.totalCost.replace(/,/g, '');
      corrected = true;
    }
    if (row.quantity) {
      row.quantity = parseInt(row.quantity, 10);
      corrected = true;
    }

    // Clean text fields
    for (const key in row) {
      if (typeof row[key] === 'string') {
        row[key] = row[key].trim().replace(/[";]/g, '');
        corrected = true;
      }
    }

    // Remove completely empty rows
    if (Object.values(row).every(value => !value)) {
      console.log('Removed empty row:', row);
      return;
    }

    // Optionally validate unique SKUs
    if (row.sku && cleanedData.some(data => data.sku === row.sku)) {
      console.error(`Duplicate SKU found: ${row.sku}`);
      return;
    }

    if (corrected) {
      console.log('Corrected row:', row);
    }

    cleanedData.push(row);
  })
  .on('end', () => {
    stringify(cleanedData, { header: true }, (err, output) => {
      if (err) {
        console.error('Error writing cleaned CSV:', err);
        return;
      }

      fs.writeFileSync(outputFilePath, output);
      console.log(`Cleaned CSV saved to ${outputFilePath}`);
    });
  });
