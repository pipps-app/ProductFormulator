// PayPal Credential Validation Test
const { PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET } = process.env;

console.log('PayPal Credential Validation Results:');
console.log('=====================================');

if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
  console.log('❌ Missing credentials');
  process.exit(1);
}

console.log('✅ Credentials found');
console.log(`Client ID: ${PAYPAL_CLIENT_ID.substring(0, 8)}... (${PAYPAL_CLIENT_ID.length} chars)`);
console.log(`Secret: ${PAYPAL_CLIENT_SECRET.substring(0, 8)}... (${PAYPAL_CLIENT_SECRET.length} chars)`);

// Determine environment based on Client ID pattern
const isSandbox = PAYPAL_CLIENT_ID.startsWith('AQ') || PAYPAL_CLIENT_ID.includes('sandbox');
const isLive = PAYPAL_CLIENT_ID.startsWith('AT') || PAYPAL_CLIENT_ID.startsWith('AV');

console.log('\nEnvironment Detection:');
console.log('======================');
if (isSandbox) {
  console.log('✅ Appears to be Sandbox credentials');
} else if (isLive) {
  console.log('⚠️  Appears to be Live/Production credentials');
  console.log('   For testing, you need Sandbox credentials');
} else {
  console.log('❓ Cannot determine credential type');
}

// Test authentication
console.log('\nTesting PayPal API Authentication...');
const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');

fetch('https://api-m.sandbox.paypal.com/v1/oauth2/token', {
  method: 'POST',
  headers: {
    'Authorization': `Basic ${auth}`,
    'Content-Type': 'application/x-www-form-urlencoded'
  },
  body: 'grant_type=client_credentials'
})
.then(response => {
  if (response.status === 200) {
    console.log('✅ Authentication successful');
    return response.json();
  } else {
    console.log(`❌ Authentication failed (${response.status})`);
    return response.json();
  }
})
.then(data => {
  if (data.access_token) {
    console.log('✅ Access token received');
    console.log('✅ PayPal integration ready');
  } else {
    console.log('❌ Error:', data.error_description || data.error);
    console.log('\n💡 Solution: Get valid Sandbox credentials from developer.paypal.com');
  }
})
.catch(error => {
  console.log('❌ Network error:', error.message);
});