require('dotenv').config();
const https = require('https');

const rawUrl = process.env.QDRANT_URL;
const url = new URL(rawUrl);
const apiKey = process.env.QDRANT_API_KEY;

console.log('Qdrant hostname:', url.hostname);

function testEndpoint(hostname, path, port) {
  return new Promise((resolve) => {
    const options = {
      hostname,
      port,
      path,
      method: 'GET',
      headers: { 'api-key': apiKey },
      timeout: 6000
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', function(d) { data += d; });
      res.on('end', function() { resolve({ ok: true, status: res.statusCode, body: data.slice(0,120) }); });
    });
    req.on('error', function(e) { resolve({ ok: false, error: e.message }); });
    req.on('timeout', function() { req.destroy(); resolve({ ok: false, error: 'TIMEOUT' }); });
    req.end();
  });
}

async function run() {
  var tests = [
    { path: '/', port: 443 },
    { path: '/healthz', port: 443 },
    { path: '/collections', port: 443 },
    { path: '/', port: 6333 },
    { path: '/healthz', port: 6333 },
  ];

  for (var i = 0; i < tests.length; i++) {
    var t = tests[i];
    var r = await testEndpoint(url.hostname, t.path, t.port);
    if (r.ok) {
      console.log('  Port ' + t.port + ' ' + t.path + ': HTTP ' + r.status + ' => ' + r.body);
    } else {
      console.log('  Port ' + t.port + ' ' + t.path + ': FAIL - ' + r.error);
    }
  }
}

run().catch(function(e) { console.error('Fatal:', e.message); });
