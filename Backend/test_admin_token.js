/**
 * Direct DB token test — bypasses password, generates JWT directly.
 * Uses the same JWT_SECRET as the server to produce a valid token for an admin user.
 */
require('dotenv').config();
const jwt = require('jsonwebtoken');
const http = require('http');

const ADMIN_ID    = '73f4f75d-21eb-4375-9384-ae3e66bedca0';
const ADMIN_EMAIL = 'nimo@gmail.com';
const ADMIN_ROLE  = 'admin';

const token = jwt.sign(
  { id: ADMIN_ID, email: ADMIN_EMAIL, role: ADMIN_ROLE },
  process.env.JWT_SECRET,
  { expiresIn: '1h' }
);

console.log('Generated admin token:', token.slice(0, 60) + '...');

function request(path) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    }, (res) => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, body: raw }); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

function check(obj, path, label) {
  const parts = path.split('.');
  let val = obj;
  for (const p of parts) val = val?.[p];
  const ok = val !== undefined && val !== null;
  console.log(`  ${ok ? '✅' : '❌'} ${label}: ${JSON.stringify(val)}`);
  return ok;
}

async function run() {
  console.log('\n============================================================');
  console.log('  TESTING /api/admin/stats');
  console.log('============================================================');
  const statsRes = await request('/api/admin/stats');
  console.log(`  HTTP ${statsRes.status}`);
  if (statsRes.status === 200) {
    console.log('\n  [ADMIN_STATS_RESPONSE]', JSON.stringify(statsRes.body, null, 2));
    console.log('\n  Field validation:');
    check(statsRes.body, 'ai.aiSuccessCount',      'ai.aiSuccessCount');
    check(statsRes.body, 'ai.aiFailureCount',       'ai.aiFailureCount');
    check(statsRes.body, 'ai.status',               'ai.status');
    check(statsRes.body, 'ai.lastErrorType',        'ai.lastErrorType');
    check(statsRes.body, 'usage.totalTransactions', 'usage.totalTransactions');
    check(statsRes.body, 'performance.aiFailureRate','performance.aiFailureRate');
    check(statsRes.body, 'users.totalUsers',        'users.totalUsers');
    check(statsRes.body, 'topics.totalTopics',      'topics.totalTopics');
    check(statsRes.body, 'stats.users',             'stats.users (legacy)');
    check(statsRes.body, 'stats.materials',         'stats.materials (legacy)');
    check(statsRes.body, 'stats.notes',             'stats.notes (legacy)');
    check(statsRes.body, 'stats.totalRevenue',      'stats.totalRevenue (legacy)');
    check(statsRes.body, 'stats.ai.status',         'stats.ai.status (legacy)');
  } else {
    console.error('  ERROR body:', JSON.stringify(statsRes.body));
  }

  console.log('\n============================================================');
  console.log('  TESTING /api/admin/analytics?days=30');
  console.log('============================================================');
  const analyticsRes = await request('/api/admin/analytics?days=30');
  console.log(`  HTTP ${analyticsRes.status}`);
  if (analyticsRes.status === 200) {
    const b = analyticsRes.body;
    console.log('\n  [ADMIN_ANALYTICS_RESPONSE]', JSON.stringify({
      userGrowthRows:        b?.charts?.userGrowth?.length,
      materialsPerDayRows:   b?.charts?.materialsPerDay?.length,
      notesDistribution:     b?.charts?.notesDistribution,
      activityItems:         b?.activity?.length,
      sampleActivity:        b?.activity?.[0]
    }, null, 2));
    console.log('\n  Field validation:');
    check(b, 'charts.userGrowth',        'charts.userGrowth');
    check(b, 'charts.materialsPerDay',   'charts.materialsPerDay');
    check(b, 'charts.notesDistribution', 'charts.notesDistribution');
    check(b, 'activity',                 'activity');
    if (b?.activity?.[0]) {
      check(b.activity[0], 'entity_type', 'activity[0].entity_type');
      check(b.activity[0], 'label',       'activity[0].label');
      check(b.activity[0], 'action',      'activity[0].action');
      check(b.activity[0], 'created_at',  'activity[0].created_at');
    }
  } else {
    console.error('  ERROR body:', JSON.stringify(analyticsRes.body));
  }

  console.log('\n============================================================');
  console.log('  AUDIT COMPLETE');
  console.log('============================================================\n');
}

run().catch(err => { console.error('[FATAL]', err.message); process.exit(1); });
