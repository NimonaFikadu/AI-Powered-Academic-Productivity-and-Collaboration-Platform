-- Migration: Add collaboration tables
-- Description: Creates tables for shared content, likes, and comments in the collaboration feature
-- Date: 2024-12-19

-- Create shared_content table
CREATE TABLE IF NOT EXISTS shared_content (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36) NOT NULL,
  content_type ENUM('topic', 'quiz') NOT NULL,
  content_url VARCHAR(500) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  tags JSON,
  likes_count INT DEFAULT 0,
  comments_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_content_type (content_type),
  INDEX idx_created_at (created_at),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create shared_content_likes table
CREATE TABLE IF NOT EXISTS shared_content_likes (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  shared_content_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_content (shared_content_id, user_id),
  FOREIGN KEY (shared_content_id) REFERENCES shared_content(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create shared_content_comments table
CREATE TABLE IF NOT EXISTS shared_content_comments (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  shared_content_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_shared_content_id (shared_content_id),
  INDEX idx_user_id (user_id),
  FOREIGN KEY (shared_content_id) REFERENCES shared_content(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Insert some sample data for testing (optional)
-- Note: Replace the user_id values with actual user IDs from your users table
/*
INSERT INTO shared_content (id, user_id, content_type, content_url, title, description, tags, likes_count, comments_count) VALUES
(UUID(), 'your-user-id-here', 'topic', 'http://localhost:3001/topics/44b416d6-ba07-49ed-b784-2ddc8cc30e15', 'Advanced React Patterns and Best Practices', 'Comprehensive guide covering advanced React patterns including render props, compound components, and custom hooks.', '["React", "JavaScript", "Frontend"]', 24, 8),
(UUID(), 'your-user-id-here', 'quiz', 'http://localhost:3001/quizzes/quiz-123', 'JavaScript ES6+ Features Quiz', 'Test your knowledge of modern JavaScript features including arrow functions, destructuring, and async/await.', '["JavaScript", "ES6", "Quiz"]', 18, 12);
*/ 