-- Add password reset fields to users table
ALTER TABLE users 
ADD COLUMN reset_password_token VARCHAR(255) NULL,
ADD COLUMN reset_password_expires DATETIME NULL;

-- Add index for faster lookups
CREATE INDEX idx_users_reset_token ON users(reset_password_token); 