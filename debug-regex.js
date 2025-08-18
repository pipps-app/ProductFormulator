// Debug script to test regex patterns
const testErrors = [
  'Category "NonexistentCategory" not found for material "Test Material 1". Available: ',
  'Category "AnotherMissingCategory" not found for material "Test Material 2". Available: ',
  'Vendor "NonexistentVendor" not found for material "Test Material 1". Available: ',
  'Vendor "AnotherMissingVendor" not found for material "Test Material 2". Available: '
];

console.log('Testing regex patterns...');
console.log('Original errors:');
testErrors.forEach((error, i) => console.log(`${i}: ${error}`));

console.log('\nTesting Category regex:');
const categoryMatches = testErrors.filter(e => e.includes('Category')).map(e => e.match(/Category "([^"]+)"/)?.[1]);
console.log('Category matches:', categoryMatches);

console.log('\nTesting Vendor regex:');
const vendorMatches = testErrors.filter(e => e.includes('Vendor')).map(e => e.match(/Vendor "([^"]+)"/)?.[1]);
console.log('Vendor matches:', vendorMatches);

console.log('\nFinal arrays:');
const missingCategories = Array.from(new Set(categoryMatches.filter(Boolean)));
const missingVendors = Array.from(new Set(vendorMatches.filter(Boolean)));
console.log('Missing categories:', missingCategories);
console.log('Missing vendors:', missingVendors);
