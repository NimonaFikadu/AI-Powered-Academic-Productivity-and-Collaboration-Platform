const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runCollaborationMigration() {
  let connection;
  
  try {
    console.log('[LOG collaboration_migration] ========= Starting collaboration tables migration');
    
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'root',
      database: process.env.DB_NAME || 'unihub_db',
      multipleStatements: true
    });
    
    console.log('[LOG collaboration_migration] ========= Connected to database');
    
    // Check if users table exists
    const [tables] = await connection.execute("SHOW TABLES LIKE 'users'");
    if (tables.length === 0) {
      throw new Error('Users table does not exist. Please run basic migrations first.');
    }
    
    // Get detailed information about users table
    const [createTable] = await connection.execute("SHOW CREATE TABLE users");
    console.log('[LOG collaboration_migration] ========= Users table structure:');
    console.log(createTable[0]['Create Table']);
    
    // Try to create tables without foreign keys first
    console.log('[LOG collaboration_migration] ========= Creating tables without foreign keys...');
    
    const createTablesSQL = `
    -- Create shared_content table without foreign keys
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
      INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
    
    -- Create shared_content_likes table without foreign keys
    CREATE TABLE IF NOT EXISTS shared_content_likes (
      id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
      shared_content_id CHAR(36) NOT NULL,
      user_id CHAR(36) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_user_content (shared_content_id, user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
    
    -- Create shared_content_comments table without foreign keys
    CREATE TABLE IF NOT EXISTS shared_content_comments (
      id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
      shared_content_id CHAR(36) NOT NULL,
      user_id CHAR(36) NOT NULL,
      comment TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_shared_content_id (shared_content_id),
      INDEX idx_user_id (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
    `;
    
    await connection.query(createTablesSQL);
    console.log('[LOG collaboration_migration] ========= Tables created successfully without foreign keys');
    
    // Now try to add foreign keys one by one
    console.log('[LOG collaboration_migration] ========= Adding foreign key constraints...');
    
    try {
      await connection.execute(`
        ALTER TABLE shared_content 
        ADD CONSTRAINT fk_shared_content_user 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      `);
      console.log('[LOG collaboration_migration] ========= Added foreign key for shared_content.user_id');
    } catch (error) {
      console.error('[LOG collaboration_migration] ========= Failed to add shared_content foreign key:', error.message);
    }
    
    try {
      await connection.execute(`
        ALTER TABLE shared_content_likes 
        ADD CONSTRAINT fk_shared_content_likes_content 
        FOREIGN KEY (shared_content_id) REFERENCES shared_content(id) ON DELETE CASCADE
      `);
      console.log('[LOG collaboration_migration] ========= Added foreign key for shared_content_likes.shared_content_id');
    } catch (error) {
      console.error('[LOG collaboration_migration] ========= Failed to add shared_content_likes content foreign key:', error.message);
    }
    
    try {
      await connection.execute(`
        ALTER TABLE shared_content_likes 
        ADD CONSTRAINT fk_shared_content_likes_user 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      `);
      console.log('[LOG collaboration_migration] ========= Added foreign key for shared_content_likes.user_id');
    } catch (error) {
      console.error('[LOG collaboration_migration] ========= Failed to add shared_content_likes user foreign key:', error.message);
    }
    
    try {
      await connection.execute(`
        ALTER TABLE shared_content_comments 
        ADD CONSTRAINT fk_shared_content_comments_content 
        FOREIGN KEY (shared_content_id) REFERENCES shared_content(id) ON DELETE CASCADE
      `);
      console.log('[LOG collaboration_migration] ========= Added foreign key for shared_content_comments.shared_content_id');
    } catch (error) {
      console.error('[LOG collaboration_migration] ========= Failed to add shared_content_comments content foreign key:', error.message);
    }
    
    try {
      await connection.execute(`
        ALTER TABLE shared_content_comments 
        ADD CONSTRAINT fk_shared_content_comments_user 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      `);
      console.log('[LOG collaboration_migration] ========= Added foreign key for shared_content_comments.user_id');
    } catch (error) {
      console.error('[LOG collaboration_migration] ========= Failed to add shared_content_comments user foreign key:', error.message);
    }
    
    // Verify tables were created
    const [newTables] = await connection.execute("SHOW TABLES LIKE 'shared_content%'");
    console.log('[LOG collaboration_migration] ========= Created tables:', newTables.map(t => Object.values(t)[0]));
    
  } catch (error) {
    console.error('[LOG collaboration_migration] ========= Migration failed:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run if called directly
if (require.main === module) {
  runCollaborationMigration()
    .then(() => {
      console.log('[LOG collaboration_migration] ========= Migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('[LOG collaboration_migration] ========= Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { runCollaborationMigration };