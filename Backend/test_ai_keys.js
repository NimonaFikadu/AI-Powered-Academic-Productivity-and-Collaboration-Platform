require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { Configuration, OpenAIApi } = require('openai');

const https = require('https');

async function testGemini() {
    console.log('--- Testing Gemini API (SDK) ---');
    if (!process.env.GEMINI_API_KEY) {
        console.log('GEMINI_API_KEY not found in .env');
        return;
    }

    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const modelName = "gemini-flash-latest";
        console.log(`Trying model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Hello");
        const response = await result.response;
        console.log(`Gemini Success with ${modelName}! Response:`, response.text());
    } catch (error) {
        console.error('Gemini Failed:', error.message);
    }
}

async function testOpenAI() {
    console.log('\n--- Testing OpenAI API ---');
    if (!process.env.OPENAI_API_KEY) {
        console.log('OPENAI_API_KEY not found in .env');
        return;
    }

    try {
        const configuration = new Configuration({
            apiKey: process.env.OPENAI_API_KEY,
        });
        const openai = new OpenAIApi(configuration);

        const completion = await openai.createChatCompletion({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: 'Hello, simple test.' }],
        });
        console.log('OpenAI Success! Response:', completion.data.choices[0].message.content);
    } catch (error) {
        console.error('OpenAI Failed:', error.message);
        if (error.response) {
            console.error('Data:', error.response.data);
            console.error('Status:', error.response.status);
        }
    }
}

async function testEmbedding() {
    console.log('\n--- Testing Gemini Embeddings ---');
    if (!process.env.GEMINI_API_KEY) {
        console.log('GEMINI_API_KEY not found in .env');
        return;
    }

    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const modelName = "embedding-001";
        console.log(`Trying embedding model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.embedContent("Hello world");
        const embedding = result.embedding;
        console.log(`Embedding Success! Vector string length: ${embedding.values.length}`);
    } catch (error) {
        console.error('Embedding Failed:', error.message);
    }
}

async function run() {
    await testGemini();
    await testEmbedding();
    // await testOpenAI(); // Skip OpenAI as we know it's failing
}

run();
