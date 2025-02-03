-- Add the answers column to quiz_attempts table if it doesn't exist


-- Check if column exists and add it if not
SET @columnExists = 0;
SELECT COUNT(*) INTO @columnExists 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'quiz_attempts' 
AND COLUMN_NAME = 'answers'
AND TABLE_SCHEMA = DATABASE();

SET @sql = IF(@columnExists = 0, 
    'ALTER TABLE quiz_attempts ADD COLUMN answers JSON',
    'SELECT "Column already exists" AS message');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt; 