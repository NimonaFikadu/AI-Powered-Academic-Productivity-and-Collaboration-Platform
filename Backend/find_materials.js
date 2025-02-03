require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
  logging: false,
  family: 4
});

async function findMaterials() {
  await sequelize.authenticate();
  let [materials] = await sequelize.query(`
    SELECT m.id, m.title, m.file_path, m.file_type, m.topic_id, t.user_id 
    FROM materials m
    INNER JOIN topics t ON m.topic_id = t.id
    LIMIT 5
  `);
  
  if (materials.length > 0) {
    console.log('[DB] Found materials:');
    materials.forEach(m => console.log(' - Path:', m.file_path, '| Type:', m.file_type, '| Topic:', m.topic_id, '| User:', m.user_id));
  } else {
    console.log('[DB] No materials found in DB.');
  }
  await sequelize.close();
}

findMaterials().catch(e => console.error(e.message));
