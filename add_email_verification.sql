-- Add email verification fields to users table
ALTER TABLE users 
ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN email_verification_token TEXT,
ADD COLUMN email_verification_expires TIMESTAMP;

-- Drop user_sessions table if it exists (we use JWT now)
DROP TABLE IF EXISTS user_sessions;
