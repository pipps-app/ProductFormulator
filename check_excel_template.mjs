import { promises as fs } from 'fs';
import path from 'path';

const filePath = path.resolve('./generated_templates/material_import_template.xlsx');

async function checkFile() {
  try {
    await fs.access(filePath);
    console.log(`✅ File found at ${filePath}`);
  } catch (err) {
    console.error(`❌ File NOT found at ${filePath}. Please check the file location.`);
  }
}

checkFile();
