const { execSync } = require('child_process');
const path = require('path');

console.log('🔧 Testing system functionality...');
console.log('Current directory:', process.cwd());
console.log('Node version:', process.version);

try {
  // Test database connectivity by running a simple query
  console.log('\n📊 Testing database connection...');
  const result = execSync('tsx --env-file=.env -e "import { db } from \'./server/database.js\'; import { rawMaterials } from \'./server/schema.js\'; async function test() { const count = await db.select().from(rawMaterials); console.log(`Materials count: ${count.length}`); process.exit(0); } test();"', { 
    encoding: 'utf-8',
    timeout: 10000
  });
  console.log('✅ Database test result:', result);
} catch (error) {
  console.error('❌ Database test failed:', error.message);
}

console.log('\n🌐 Server status:');
try {
  const serverCheck = execSync('netstat -ano | findstr :5000', { 
    encoding: 'utf-8',
    timeout: 5000 
  });
  console.log('✅ Server is running on port 5000');
  console.log(serverCheck);
} catch (error) {
  console.log('❌ No server detected on port 5000');
}

console.log('\n📁 Key files check:');
const keyFiles = [
  'server/index.ts',
  'client/src/components/formulations/formulation-form.tsx',
  'client/src/components/materials/material-form.tsx',
  'package.json'
];

keyFiles.forEach(file => {
  try {
    const fs = require('fs');
    const stats = fs.statSync(file);
    console.log(`✅ ${file} (${Math.round(stats.size/1024)}KB)`);
  } catch (error) {
    console.log(`❌ ${file} not found`);
  }
});
