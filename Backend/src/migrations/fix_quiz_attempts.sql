-- Fix quiz_attempts table schema


-- 1. Make sure answers column exists and has correct type
SET @columnExists = 0;
SELECT COUNT(*) INTO @columnExists 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'quiz_attempts' 
AND COLUMN_NAME = 'answers'
AND TABLE_SCHEMA = DATABASE();

SET @sql = IF(@columnExists > 0, 
    'ALTER TABLE quiz_attempts MODIFY COLUMN answers JSON',
    'ALTER TABLE quiz_attempts ADD COLUMN answers JSON');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2. Make sure completed_at column exists
SET @columnExists = 0;
SELECT COUNT(*) INTO @columnExists 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'quiz_attempts' 
AND COLUMN_NAME = 'completed_at'
AND TABLE_SCHEMA = DATABASE();

SET @sql = IF(@columnExists = 0, 
    'ALTER TABLE quiz_attempts ADD COLUMN completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
    'SELECT "completed_at column already exists" AS message');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3. Fix the completed column if it exists (rename to completed_at if needed)
SET @columnExists = 0;
SELECT COUNT(*) INTO @columnExists 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'quiz_attempts' 
AND COLUMN_NAME = 'completed'
AND TABLE_SCHEMA = DATABASE();

SET @sql = IF(@columnExists > 0, 
    'UPDATE quiz_attempts SET completed = 1 WHERE completed IS NULL',
    'SELECT "No completed column found" AS message');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt; 