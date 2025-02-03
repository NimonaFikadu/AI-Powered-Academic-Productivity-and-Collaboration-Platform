-- Fix quizzes table schema to make it compatible with our application


-- 1. Check and set questions column to NOT NULL with default empty JSON
SET @columnExists = 0;
SELECT COUNT(*) INTO @columnExists 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'quizzes' 
AND COLUMN_NAME = 'questions'
AND TABLE_SCHEMA = DATABASE();

-- If questions column exists, modify it to have a default value
SET @sql = IF(@columnExists > 0, 
    'ALTER TABLE quizzes MODIFY COLUMN questions JSON NOT NULL DEFAULT (JSON_OBJECT())',
    'ALTER TABLE quizzes ADD COLUMN questions JSON NOT NULL DEFAULT (JSON_OBJECT())');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2. Check and add is_public column if it doesn't exist
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

-- 3. Check and add is_ai_generated column if it doesn't exist 
SET @columnExists = 0;
SELECT COUNT(*) INTO @columnExists 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'quizzes' 
AND COLUMN_NAME = 'is_ai_generated'
AND TABLE_SCHEMA = DATABASE();

SET @sql = IF(@columnExists = 0, 
    'ALTER TABLE quizzes ADD COLUMN is_ai_generated BOOLEAN DEFAULT FALSE',
    'SELECT "is_ai_generated column already exists" AS message');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 4. Update any existing records to have valid questions field
UPDATE quizzes SET questions = JSON_OBJECT() WHERE questions IS NULL; 