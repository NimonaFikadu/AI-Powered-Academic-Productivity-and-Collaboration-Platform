
const { QdrantClient } = require('@qdrant/js-client-rest');
require('dotenv').config();

async function testQdrant() {
    const url = process.env.QDRANT_URL;
    const apiKey = process.env.QDRANT_API_KEY;

    console.log('Testing Qdrant connection to:', url);
    console.log('API Key length:', apiKey ? apiKey.length : 0);

    const client = new QdrantClient({
        url: url,
        apiKey: apiKey
    });

    try {
        console.log('Calling getCollections...');
        const collections = await client.getCollections();
        console.log('✅ Success! Collections:', JSON.stringify(collections));
    } catch (error) {
        console.error('❌ Failed:', error.message);
        if (error.cause) {
            console.error('Cause:', error.cause.message);
        }
    }
}

testQdrant();
