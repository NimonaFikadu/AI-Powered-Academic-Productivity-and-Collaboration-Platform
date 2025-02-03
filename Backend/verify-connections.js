const { sequelize } = require('./src/models');
const { Configuration, OpenAIApi } = require('openai');
const { QdrantClient } = require('@qdrant/js-client-rest');
require('dotenv').config();

async function verifyConnections() {
    console.log('=========================================');
    console.log('UniHub Connection Verification');
    console.log('=========================================\n');

    // 1. Verify Supabase/Postgres
    console.log('[1/3] Verifying Supabase connection...');
    try {
        await sequelize.authenticate();
        console.log('✅ Supabase: Connected successfully.\n');
    } catch (error) {
        console.error('❌ Supabase: Connection failed!');
        console.error('   Error:', error.message, '\n');
    }

    // 2. Verify OpenAI
    console.log('[2/3] Verifying OpenAI API connection...');
    if (!process.env.OPENAI_API_KEY) {
        console.log('⚠️ OpenAI: API key missing. Skipping request...\n');
    } else {
        try {
            const configuration = new Configuration({
                apiKey: process.env.OPENAI_API_KEY,
            });
            const openai = new OpenAIApi(configuration);

            // Simple embedding request
            await openai.createEmbedding({
                model: 'text-embedding-ada-002',
                input: 'Hello UniHub',
            });
            console.log('✅ OpenAI: API key and request working.\n');
        } catch (error) {
            console.error('❌ OpenAI: Connection failed!');
            console.error('   Error:', error.response?.data?.error?.message || error.message, '\n');
        }
    }

    // 3. Verify Qdrant
    console.log('[3/3] Verifying Qdrant connection...');
    if (!process.env.QDRANT_URL || !process.env.QDRANT_API_KEY) {
        console.log('⚠️ Qdrant: Credentials missing. Skipping...\n');
    } else {
        try {
            const client = new QdrantClient({
                url: process.env.QDRANT_URL,
                apiKey: process.env.QDRANT_API_KEY
            });
            const collections = await client.getCollections();
            console.log(`✅ Qdrant: Connected. Found ${collections.collections.length} collections.\n`);
        } catch (error) {
            console.error('❌ Qdrant: Connection failed!');
            console.error('   Error:', error.message, '\n');
        }
    }

    console.log('=========================================');
    console.log('Verification Complete');
    console.log('=========================================');
    process.exit(0);
}

verifyConnections();
