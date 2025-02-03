require('dotenv').config();
const https = require('https');
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function listEmbeddingModels() {
    console.log('--- Listing Gemini Embedding Models (REST) ---');
    if (!process.env.GEMINI_API_KEY) {
        console.log('GEMINI_API_KEY not found in .env');
        return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                if (res.statusCode === 200) {
                    try {
                        const models = JSON.parse(data);
                        console.log('Available Models supporting embedContent:');
                        if (models.models) {
                            models.models.forEach(m => {
                                if (m.supportedGenerationMethods && m.supportedGenerationMethods.includes('embedContent')) {
                                    console.log(`- ${m.name}`);
                                }
                            });
                        } else {
                            console.log('No models found in response:', data);
                        }
                    } catch (e) {
                        console.error('Error parsing JSON:', e);
                        console.log('Raw Data:', data);
                    }
                } else {
                    console.error(`API Request Failed with Status ${res.statusCode}`);
                    console.log('Response:', data);
                }
                resolve();
            });
        }).on('error', (err) => {
            console.error('Network Error:', err.message);
            resolve();
        });
    });
}

async function testEmbedding() {
    console.log('\n--- Testing Gemini Embedding Generation ---');
    if (!process.env.GEMINI_API_KEY) {
        console.log('GEMINI_API_KEY not found in .env');
        return;
    }

    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const modelName = "text-embedding-004";
        console.log(`Trying embedding model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.embedContent("Hello world test");
        const embedding = result.embedding;
        console.log(`Embedding Success! Vector string length: ${embedding.values.length}`);
    } catch (error) {
        console.error('Embedding Failed:', error.message);
    }
}

async function run() {
    // await listEmbeddingModels();
    await testEmbedding();
}

run();
