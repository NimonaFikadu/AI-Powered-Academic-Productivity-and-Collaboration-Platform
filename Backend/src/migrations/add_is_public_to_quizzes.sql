-- Add is_public column to quizzes table if it doesn't exist


-- Check if column exists and add it if not
SET @columnExists = 0;
SELECT COUNT(*) INTO @columnExists 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'quizzes' 
AND COLUMN_NAME = 'is_public'
AND TABLE_SCHEMA = DATABASE();

SET @sql = IF(@columnExists = 0, 
    'ALTER TABLE quizzes ADD COLUMN is_public BOOLEAN DEFAULT FALSE',
    'SELECT "Column already exists" AS message');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt; 