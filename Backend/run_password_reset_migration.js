const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runPasswordResetMigration() {
  let connection;
  
  try {
    console.log('[LOG password_reset_migration] ========= Starting password reset fields migration');
    
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'root',
      database: process.env.DB_NAME || 'unihub_db',
      multipleStatements: true
    });
    
    console.log('[LOG password_reset_migration] ========= Connected to database');
    
    // Check if users table exists
    const [tables] = await connection.execute("SHOW TABLES LIKE 'users'");
    if (tables.length === 0) {
      throw new Error('Users table does not exist. Please run basic migrations first.');
    }
    
    // Check if reset fields already exist
    const [columns] = await connection.execute("SHOW COLUMNS FROM users LIKE 'reset_password_token'");
    if (columns.length > 0) {
      console.log('[LOG password_reset_migration] ========= Password reset fields already exist, skipping migration');
      return;
    }
    
    // Read and execute migration SQL
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'src/migrations/add_password_reset_fields.sql'),
      'utf8'
    );
    
    await connection.query(migrationSQL);
    console.log('[LOG password_reset_migration] ========= Password reset fields added successfully');
    
    // Verify fields were added
    const [newColumns] = await connection.execute("SHOW COLUMNS FROM users WHERE Field IN ('reset_password_token', 'reset_password_expires')");
    console.log('[LOG password_reset_migration] ========= Added fields:', newColumns.map(col => col.Field));
    
  } catch (error) {
    console.error('[LOG password_reset_migration] ========= Migration failed:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run if called directly
if (require.main === module) {
  runPasswordResetMigration()
    .then(() => {
      console.log('[LOG password_reset_migration] ========= Migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('[LOG password_reset_migration] ========= Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { runPasswordResetMigration }; 