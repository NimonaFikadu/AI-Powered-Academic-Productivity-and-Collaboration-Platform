console.log('--- Diagnostic Start ---');
require('dotenv').config();
console.log('1. Dotenv loaded');

try {
    const database = require('./src/config/database');
    console.log('2. Database config loaded');
    
    const { Sequelize } = require('sequelize');
    console.log('3. Sequelize loaded');

    const User = require('./src/models/user.model');
    console.log('4. User model loaded');
    
    // Test a single require from models/index
    const { sequelize } = require('./src/models');
    console.log('5. Models/index loaded (Associations complete)');
    
    async function run() {
        console.log('6. Authenticating...');
        await sequelize.authenticate();
        console.log('7. Authentication successful');
        process.exit(0);
    }
    
    run();
} catch (e) {
    console.error('Error during diagnostic:', e);
    process.exit(1);
}
