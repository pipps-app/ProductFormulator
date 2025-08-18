-- SQL script to set admin role
-- Run this in your PostgreSQL database

UPDATE users 
SET role = 'admin' 
WHERE email = 'admin@test.com';

-- Verify the update
SELECT email, role, password IS NOT NULL as has_password 
FROM users 
WHERE email = 'admin@test.com';
