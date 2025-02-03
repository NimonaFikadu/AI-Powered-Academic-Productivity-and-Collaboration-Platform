/**
 * Tests analytics SQL queries using the backend's own Sequelize config.
 */
process.env.NODE_ENV = 'test';
require('dotenv').config();

// Reuse the backend's exact sequelize instance
const sequelize = require('./src/config/database');
const { QueryTypes } = require('sequelize');

async function run() {
  try {
    await sequelize.authenticate();
    console.log('DB connected via backend config.\n');
  } catch (e) {
    console.error('DB auth failed:', e.message);
    process.exit(1);
  }

  const days = 30;

  async function testQuery(label, sql, replacements) {
    console.log(`=== ${label} ===`);
    try {
      const opts = { type: QueryTypes.SELECT };
      if (replacements) opts.replacements = replacements;
      const rows = await sequelize.query(sql, opts);
      console.log(`✅ OK — ${rows.length} row(s)`);
      if (rows[0]) console.log('   Sample:', JSON.stringify(rows[0]));
    } catch (err) {
      console.error('❌ FAILED:', err.message);
      if (err.original?.message) console.error('   PG error:', err.original.message);
      if (err.sql) console.error('   SQL sent:', err.sql.slice(0, 200));
    }
    console.log('');
  }

  // Test 1: original broken syntax
  await testQuery(
    'Test 1: Original (? * INTERVAL)',
    `SELECT DATE_TRUNC('day', created_at) as date, COUNT(*) as count
     FROM users
     WHERE created_at >= (CURRENT_DATE - (? * INTERVAL '1 day'))
     GROUP BY DATE_TRUNC('day', created_at)
     ORDER BY DATE_TRUNC('day', created_at) ASC`,
    [days]
  );

  // Test 2: INTERVAL '1 day' * ?
  await testQuery(
    'Test 2: INTERVAL * ? (reversed)',
    `SELECT DATE_TRUNC('day', created_at) as date, COUNT(*) as count
     FROM users
     WHERE created_at >= (CURRENT_DATE - (INTERVAL '1 day' * ?))
     GROUP BY DATE_TRUNC('day', created_at)
     ORDER BY DATE_TRUNC('day', created_at) ASC`,
    [days]
  );

  // Test 3: CAST to integer 
  await testQuery(
    'Test 3: CAST(? AS INTEGER) * INTERVAL',
    `SELECT DATE_TRUNC('day', created_at) as date, COUNT(*) as count
     FROM users
     WHERE created_at >= (CURRENT_DATE - (CAST(? AS INTEGER) * INTERVAL '1 day'))
     GROUP BY DATE_TRUNC('day', created_at)
     ORDER BY DATE_TRUNC('day', created_at) ASC`,
    [days]
  );

  // Test 4: named param approach
  await testQuery(
    'Test 4: make_interval(days := :days)',
    `SELECT DATE_TRUNC('day', created_at) as date, COUNT(*) as count
     FROM users
     WHERE created_at >= CURRENT_DATE - make_interval(days := :days)
     GROUP BY DATE_TRUNC('day', created_at)
     ORDER BY DATE_TRUNC('day', created_at) ASC`,
    { days }
  );

  // Test 5: hardcoded (sanity check)
  await testQuery(
    'Test 5: Hardcoded interval (sanity)',
    `SELECT DATE_TRUNC('day', created_at) as date, COUNT(*) as count
     FROM users
     WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
     GROUP BY DATE_TRUNC('day', created_at)
     ORDER BY DATE_TRUNC('day', created_at) ASC`,
    null
  );

  // Test 6: privacyCounts original (is_private = 1 in postgres)
  await testQuery(
    'Test 6: privacyCounts original CASE (is_private = 1 OR true)',
    `SELECT
       CASE WHEN (is_private = 1 OR is_private = true) THEN 'Private' ELSE 'Public' END as name,
       COUNT(*) as value
     FROM notes
     GROUP BY CASE WHEN (is_private = 1 OR is_private = true) THEN 'Private' ELSE 'Public' END`,
    null
  );

  // Test 7: privacyCounts fixed (boolean-only)
  await testQuery(
    'Test 7: privacyCounts fixed (is_private = true only)',
    `SELECT
       CASE WHEN is_private = true THEN 'Private' ELSE 'Public' END as name,
       COUNT(*) as value
     FROM notes
     GROUP BY CASE WHEN is_private = true THEN 'Private' ELSE 'Public' END`,
    null
  );

  console.log('=== DONE ===');
  process.exit(0);
}

run().catch(err => { console.error('[FATAL]', err.message, err.stack); process.exit(1); });
