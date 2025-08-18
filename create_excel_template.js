const XLSX = require('xlsx');

const data = [
  ["name", "categoryName", "vendorName", "totalCost", "quantity", "unit", "sku", "notes"],
  ["Olive Oil", "Oils", "SupplierA", "50.00", "10", "kg", "OLV-001", "High quality"],
  ["Coconut Oil", "Oils", "SupplierB", "30.00", "5", "kg", "COC-002", "Organic"],
  ["Lye", "Chemicals", "SupplierC", "20.00", "2", "kg", "LYE-003", "For saponification"]
];

const ws = XLSX.utils.aoa_to_sheet(data);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, "Materials");

XLSX.writeFile(wb, "material_import_template.xlsx");
console.log('Excel file created: material_import_template.xlsx');
