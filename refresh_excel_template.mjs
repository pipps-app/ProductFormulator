import { promises as fs } from 'fs';
import path from 'path';

const filePath = path.resolve('./generated_templates/material_import_template.xlsx');
const dest = path.resolve('./server/static/templates/material_import_template.xlsx');

async function checkAndCopy() {
  try {
    await fs.access(filePath);
    console.log(`✅ File found at ${filePath}`);
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.copyFile(filePath, dest);
    console.log(`✅ File copied successfully to ${dest}`);
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.error(`❌ File NOT found at ${filePath}. Please check the file location.`);
    } else {
      console.error('❌ Error copying file:', err);
    }
  }
}

checkAndCopy();
