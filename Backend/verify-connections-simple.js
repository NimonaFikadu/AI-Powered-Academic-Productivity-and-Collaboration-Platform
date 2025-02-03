console.log('Script started');
require('dotenv').config();
console.log('Dotenv loaded');
const { Configuration, OpenAIApi } = require('openai');
console.log('OpenAI loaded');
const { QdrantClient } = require('@qdrant/js-client-rest');
console.log('Qdrant loaded');

async function test() {
    console.log('Starting test...');
    try {
        const client = new QdrantClient({
            url: process.env.QDRANT_URL,
            apiKey: process.env.QDRANT_API_KEY
        });
        console.log('Qdrant client initialized');
        const collections = await client.getCollections();
        console.log('Qdrant collections fetched:', collections.collections.length);
    } catch (e) {
        console.log('Qdrant error:', e.message);
    }
    process.exit(0);
}

test();
