const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || "your-jwt-secret-change-this";

// Generate token for user ID 3
const token = jwt.sign({ id: 3, role: 'user' }, JWT_SECRET, { expiresIn: '1h' });
console.log('Bearer token for API testing:');
console.log(`Bearer ${token}`);
