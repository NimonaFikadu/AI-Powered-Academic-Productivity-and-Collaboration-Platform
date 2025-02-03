require('dotenv').config();
const { Sequelize } = require('sequelize');

const db = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: { require: true, rejectUnauthorized: false }
  },
  logging: false
});

const sql = `
  ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS reset_password_token VARCHAR(255),
  ADD COLUMN IF NOT EXISTS reset_password_expires TIMESTAMP WITH TIME ZONE;
`;

db.authenticate()
  .then(() => db.query(sql))
  .then(() => {
    console.log('SUCCESS: reset_password_token and reset_password_expires columns added!');
    process.exit(0);
  })
  .catch(err => {
    console.error('ERROR:', err.message);
    process.exit(1);
  });
