const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { runSingleFile } = require('./run_migrations');

// Function to show how a migration file would be transformed
function previewMigrationChanges(filePath) {
  try {
    // Read the original file
    const originalSql = fs.readFileSync(filePath, 'utf8');
    
    // Get database name from environment
    const DB_NAME = process.env.DB_NAME || 'unihub_db';
    
    // Apply the same transformations as in runSingleFile
    let transformedSql = originalSql;
    transformedSql = transformedSql.replace(/USE\s+`?[a-zA-Z0-9_]+`?;?/gi, '');
    transformedSql = transformedSql.replace(/DATABASE\(\)/gi, `'${DB_NAME}'`);
    
    console.log('\n[LOG preview] ========= Original SQL:');
    console.log(originalSql.substring(0, 300) + '...');
    
    console.log('\n[LOG preview] ========= Transformed SQL:');
    console.log(transformedSql.substring(0, 300) + '...');
    
    return { originalSql, transformedSql };
  } catch (error) {
    console.error('[LOG preview] ========= Error during preview:', error);
    return { error };
  }
}

// If script is run directly, preview and run the first migration file
if (require.main === module) {
  const migrationFiles = fs.readdirSync(__dirname)
    .filter(file => file.endsWith('.sql'))
    .map(file => path.join(__dirname, file))
    .sort();
  
  if (migrationFiles.length === 0) {
    console.error('[LOG test] ========= No SQL migration files found');
    process.exit(1);
  }
  
  const testFile = migrationFiles[0]; // Use the first migration file for testing
  console.log(`[LOG test] ========= Testing with migration file: ${path.basename(testFile)}`);
  
  // Preview changes
  const { originalSql, transformedSql, error } = previewMigrationChanges(testFile);
  
  if (error) {
    console.error('[LOG test] ========= Failed to preview migration changes');
    process.exit(1);
  }
  
  console.log('\n[LOG test] ========= Do you want to run this migration? (y/n)');
  // In a real interactive scenario, you would get input here
  // For demo purposes, we're just showing the preview
}

module.exports = {
  previewMigrationChanges
}; 