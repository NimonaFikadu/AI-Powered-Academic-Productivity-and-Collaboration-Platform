
const { execSync } = require('child_process');
try {
    console.log('Running diagnostic curl from node...');
    const output = execSync('curl -v https://a9a702c7-c7fa-4b6e-add3-3db76dbd8764.us-east4-0.gcp.cloud.qdrant.io:6333/collections', { encoding: 'utf8' });
    console.log('Curl output:', output);
} catch (e) {
    console.error('Curl failed from node:', e.message);
}
