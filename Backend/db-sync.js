const { sequelize } = require('./src/models');

async function syncDB() {
    try {
        console.log('Connecting to Supabase...');
        await sequelize.authenticate();
        console.log('✅ Connection established.');

        console.log('Syncing database schema (this may take a minute)...');
        const startTime = Date.now();
        await sequelize.sync({ alter: true });
        const duration = (Date.now() - startTime) / 1000;

        console.log(`✅ Database synced successfully in ${duration}s!`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Failed to sync database:', error);
        process.exit(1);
    }
}

syncDB();
