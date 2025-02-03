const sequelize = require('./index');

async function checkTables() {
  try {
    const [results] = await sequelize.query('SHOW TABLES;');
    console.log('Tables in the database:');
    results.forEach((result) => {
      console.log('-', Object.values(result)[0]);
    });
  } catch (error) {
    console.error('Error checking tables:', error);
  } finally {
    await sequelize.close();
  }
}

checkTables(); 