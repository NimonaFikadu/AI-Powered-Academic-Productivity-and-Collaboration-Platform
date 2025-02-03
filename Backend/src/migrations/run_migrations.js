const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { Client } = require('pg');

/**
 * Runs a SQL file as a single batch
 * @param {string} filePath - Path to the SQL file
 * @returns {Promise<boolean>} - Success status
 */
async function runSingleFile(filePath) {
  try {
    // Read SQL file
    console.log(`[LOG migration] ========= Running migration from ${path.basename(filePath)}`);
    let sql = fs.readFileSync(filePath, 'utf8');

    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL is not set. PostgreSQL migrations require DATABASE_URL.');
    }

    const ssl = process.env.DB_SSL === 'true'
      ? { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false' }
      : undefined;

    const client = new Client({
      connectionString: databaseUrl,
      ssl
    });

    console.log('[LOG migration] ========= Connecting to PostgreSQL');
    await client.connect();
    console.log('[LOG migration] ========= Connected to PostgreSQL');

    console.log('[LOG migration] ========= Running SQL file as a batch...');
    await client.query(sql);

    console.log('[LOG migration] ========= Migration completed successfully!');
    await client.end();
    return true;
  } catch (error) {
    console.error('[LOG migration] ========= Error during migration:', error);
    return false;
  }
}

/**
 * Get all SQL files from the migrations directory
 * @returns {Array<string>} Array of file paths sorted by filename
 */
function getSqlFiles() {
  const migrationsDir = process.env.MIGRATIONS_DIR || __dirname;
  const dialectFromUrl = process.env.DATABASE_URL?.startsWith('postgres') ? 'postgres' : undefined;
  const dialect = (process.env.DB_DIALECT || dialectFromUrl || '').toLowerCase();

  const files = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .filter(file => {
      if (dialect !== 'postgres') return true;
      // Existing SQL migrations in this repo were written for MySQL.
      // When running against PostgreSQL, only run migrations that are explicitly PostgreSQL-compatible.
      return file === 'add_subscription_and_transactions.sql';
    })
    .map(file => path.join(migrationsDir, file));
  
  // Sort files alphabetically so they run in order
  return files.sort();
}

async function runMigrations() {
  // Get all SQL migration files
  const migrationFiles = getSqlFiles();
  
  console.log(`[LOG migration] ========= Found ${migrationFiles.length} migration files to run:`);
  migrationFiles.forEach((file, index) => {
    console.log(`[LOG migration] ========= ${index + 1}. ${path.basename(file)}`);
  });
  
  let success = true;
  
  for (const sqlFile of migrationFiles) {
    const result = await runSingleFile(sqlFile);
    if (!result) {
      success = false;
      console.error(`[LOG migration] ========= Failed to run migration: ${path.basename(sqlFile)}`);
    }
  }
  
  return success;
}

// Run migrations when script is executed directly
if (require.main === module) {
  runMigrations().then(success => {
    if (!success) {
      process.exit(1);
    } else {
      console.log('[LOG migration] ========= All migrations completed successfully!');
    }
  }).catch(error => {
    console.error('[LOG migration] ========= Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = { 
  runMigrations,
  runSingleFile 
}; 