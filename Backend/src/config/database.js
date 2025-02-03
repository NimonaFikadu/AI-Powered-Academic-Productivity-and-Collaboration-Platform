require('dotenv').config();
const { Sequelize } = require('sequelize');

const env = process.env.NODE_ENV || 'development';
const defaultFamily = (() => {
  if (process.env.DB_FAMILY) return parseInt(process.env.DB_FAMILY || '0');
  const dialectFromUrl = process.env.DATABASE_URL?.startsWith('postgres') ? 'postgres' : undefined;
  const dialect = process.env.DB_DIALECT || dialectFromUrl;
  return dialect === 'postgres' ? 4 : 0;
})();
const config = {
  development: {
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME,
    host: process.env.DB_HOST || '127.0.0.1',
    dialect: process.env.DB_DIALECT || 'mysql',
    logging: process.env.DB_LOGGING === 'true' ? console.log : false
  },
  test: {
    username: process.env.TEST_DB_USER || process.env.DB_USER || 'root',
    password: process.env.TEST_DB_PASSWORD || process.env.DB_PASSWORD || '',
    database: process.env.TEST_DB_NAME || 'unihub_test',
    host: process.env.TEST_DB_HOST || process.env.DB_HOST || '127.0.0.1',
    dialect: process.env.DB_DIALECT || 'mysql',
    logging: process.env.DB_LOGGING === 'true' ? console.log : false
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT || 'mysql',
    logging: false,
    dialectOptions: {
      ssl: {
        require: process.env.DB_SSL === 'true',
        rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false'
      }
    },
    pool: {
      max: parseInt(process.env.DB_POOL_MAX || '5'),
      min: parseInt(process.env.DB_POOL_MIN || '0'),
      acquire: parseInt(process.env.DB_POOL_ACQUIRE || '30000'),
      idle: parseInt(process.env.DB_POOL_IDLE || '10000')
    }
  }
};

// Allow using DATABASE_URL environment variable (common in cloud deployments and Supabase)
if (process.env.DATABASE_URL) {
  const dialect = process.env.DB_DIALECT || (process.env.DATABASE_URL.startsWith('postgres') ? 'postgres' : 'mysql');
  
  module.exports = new Sequelize(process.env.DATABASE_URL, {
    dialect: dialect,
    dialectOptions: {
      ssl: process.env.DB_SSL === 'true' ? {
        require: true,
        rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false'
      } : false,
      family: defaultFamily
    },
    logging: process.env.DB_LOGGING === 'true' ? console.log : false,
    pool: {
      max: parseInt(process.env.DB_POOL_MAX || '5'),
      min: parseInt(process.env.DB_POOL_MIN || '0'),
      acquire: parseInt(process.env.DB_POOL_ACQUIRE || '30000'),
      idle: parseInt(process.env.DB_POOL_IDLE || '10000')
    }
  });
} else {
  module.exports = new Sequelize(
    config[env].database,
    config[env].username,
    config[env].password,
    {
      host: config[env].host,
      dialect: config[env].dialect,
      logging: config[env].logging,
      dialectOptions: config[env].dialectOptions,
      pool: config[env].pool
    }
  );
}