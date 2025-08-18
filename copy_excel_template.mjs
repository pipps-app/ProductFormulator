import { promises as fs } from 'fs';
import path from 'path';

const src = path.resolve('./generated_templates/material_import_template.xlsx');
const dest = path.resolve('./server/static/templates/material_import_template.xlsx');

async function copyTemplate() {
  try {
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.copyFile(src, dest);
    console.log(`✅ File copied successfully to ${dest}`);
  } catch (err) {
    console.error('❌ Error copying file:', err);
  }
}

copyTemplate();
