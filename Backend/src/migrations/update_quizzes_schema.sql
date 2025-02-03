-- Update quizzes table schema to ensure all required columns exist


-- Add is_public column if it doesn't exist
SET @columnExists = 0;
SELECT COUNT(*) INTO @columnExists 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'quizzes' 
AND COLUMN_NAME = 'is_public'
AND TABLE_SCHEMA = DATABASE();

SET @sql = IF(@columnExists = 0, 
    'ALTER TABLE quizzes ADD COLUMN is_public BOOLEAN DEFAULT FALSE',
    'SELECT "is_public column already exists" AS message');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check if JSON questions column exists (original schema had this)
SET @columnExists = 0;
SELECT COUNT(*) INTO @columnExists 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'quizzes' 
AND COLUMN_NAME = 'questions'
AND TABLE_SCHEMA = DATABASE();

-- If questions column doesn't exist, we need to add it
-- Some code may expect this column to exist
SET @sql = IF(@columnExists = 0, 
    'ALTER TABLE quizzes ADD COLUMN questions JSON NULL',
    'SELECT "questions column already exists" AS message');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Set questions column to empty JSON object if it's NULL
UPDATE quizzes SET questions = '{}' WHERE questions IS NULL; 