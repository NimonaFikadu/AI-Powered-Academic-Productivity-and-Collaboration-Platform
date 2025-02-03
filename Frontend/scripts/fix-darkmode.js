// This script will reverse dark mode changes in the codebase
// It removes dark:bg-n700 from bg-primaryColor/5 and dark:bg-n0 from bg-white classes

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Directories to check
const dirs = [
  path.join(__dirname, '../app'),
  path.join(__dirname, '../components'),
];

// Function to find all .tsx and .jsx files recursively
function findFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      findFiles(filePath, fileList);
    } else if (
      stat.isFile() && 
      (filePath.endsWith('.tsx') || filePath.endsWith('.jsx'))
    ) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Function to process a file
function processFile(filePath) {
  try {
    console.log(`Processing ${filePath}`);
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Revert bg-primaryColor/5 dark:bg-n700 to just bg-primaryColor/5
    const bgPrimaryPattern = /bg-primaryColor\/5\s+dark:bg-n700/g;
    if (bgPrimaryPattern.test(content)) {
      content = content.replace(bgPrimaryPattern, 'bg-primaryColor/5');
      modified = true;
    }
    
    // Revert bg-white dark:bg-n0 to just bg-white
    const bgWhitePattern = /bg-white\s+dark:bg-n0/g;
    if (bgWhitePattern.test(content)) {
      content = content.replace(bgWhitePattern, 'bg-white');
      modified = true;
    }
    
    // Revert hover:bg-primaryColor/5 dark:hover:bg-n700 to just hover:bg-primaryColor/5
    const hoverBgPattern = /hover:bg-primaryColor\/5\s+dark:hover:bg-n700/g;
    if (hoverBgPattern.test(content)) {
      content = content.replace(hoverBgPattern, 'hover:bg-primaryColor/5');
      modified = true;
    }
    
    // Revert text-n700 dark:text-n30 to remove dark mode variants
    const textPattern = /text-n700\s+dark:text-n30/g;
    if (textPattern.test(content)) {
      content = content.replace(textPattern, 'text-n700');
      modified = true;
    }
    
    // Save changes if modified
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Reverted dark mode in ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
    return false;
  }
}

// Main function
function main() {
  console.log('Reverting dark mode changes...');
  
  let totalFiles = 0;
  let revertedFiles = 0;
  
  dirs.forEach(dir => {
    const files = findFiles(dir);
    totalFiles += files.length;
    
    files.forEach(file => {
      if (processFile(file)) {
        revertedFiles++;
      }
    });
  });
  
  console.log(`\nDark mode reversion completed!`);
  console.log(`Processed ${totalFiles} files, reverted ${revertedFiles} files.`);
}

main(); 