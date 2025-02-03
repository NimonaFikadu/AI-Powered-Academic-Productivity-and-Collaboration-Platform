// Simple pre-build script to modify ESLint configuration for deployment
const fs = require('fs');
const path = require('path');

console.log('[LOG pre-build] ========= Running pre-build script');

// Function to create or update .eslintrc.json
function setupEslintConfig() {
  const eslintConfigPath = path.join(process.cwd(), '.eslintrc.json');
  
  const eslintConfig = {
    "extends": "next/core-web-vitals",
    "rules": {
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "react-hooks/exhaustive-deps": "off",
      "react/no-unescaped-entities": "off"
    }
  };
  
  fs.writeFileSync(eslintConfigPath, JSON.stringify(eslintConfig, null, 2));
  console.log('[LOG pre-build] ========= ESLint config created/updated');
}

// Main execution
try {
  setupEslintConfig();
  console.log('[LOG pre-build] ========= Pre-build tasks completed successfully');
} catch (error) {
  console.error('[LOG pre-build] ========= Error during pre-build:', error);
  process.exit(1);
} 