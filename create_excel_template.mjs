import xlsx from "xlsx";
import { mkdir, writeFile } from 'fs/promises';  // <-- use Node's writeFile
import path from 'path';

const data = [
  ["Material", "Category", "Vendor", "TotalCost", "Quantity", "Unit", "SKU", "Notes"],
  ["Olive Oil", "Oils", "SupplierA", "50.00", "10", "kg", "OLV-001", "High quality"],
  ["Coconut Oil", "Oils", "SupplierB", "30.00", "5", "kg", "COC-002", "Organic"],
  ["Lye", "Chemicals", "SupplierC", "20.00", "2", "kg", "LYE-003", "For saponification"],
];

const ws = xlsx.utils.aoa_to_sheet(data);
const wb = xlsx.utils.book_new();
xlsx.utils.book_append_sheet(wb, ws, "Materials");

const outDir = path.resolve('./generated_templates');
const outPath = path.join(outDir, 'material_import_template.xlsx');

try {
  await mkdir(outDir, { recursive: true });

  const wbBuffer = xlsx.write(wb, { bookType: 'xlsx', type: 'buffer' });

  await writeFile(outPath, wbBuffer);  // <-- fixed line

  console.log(`✅ Excel file created successfully at: ${outPath}`);
} catch (err) {
  console.error('❌ Error creating Excel file:', err);
}
