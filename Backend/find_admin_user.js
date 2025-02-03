/**
 * Finds the first admin user in the database to use for testing.
 */
require('dotenv').config();
const { Sequelize, QueryTypes } = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  ssl: true,
  dialectOptions: {
    ssl: { require: true, rejectUnauthorized: false }
  },
  logging: false
});

async function findAdmin() {
  try {
    await sequelize.authenticate();
    const rows = await sequelize.query(
      "SELECT id, email, role FROM users WHERE role = 'admin' LIMIT 3",
      { type: QueryTypes.SELECT }
    );
    if (rows.length === 0) {
      console.log('NO ADMIN USERS FOUND in database.');
    } else {
      console.log('Admin users found:');
      rows.forEach(r => console.log(`  id=${r.id}  email=${r.email}  role=${r.role}`));
    }
  } catch (e) {
    console.error('DB error:', e.message);
  } finally {
    await sequelize.close();
  }
}

findAdmin();
