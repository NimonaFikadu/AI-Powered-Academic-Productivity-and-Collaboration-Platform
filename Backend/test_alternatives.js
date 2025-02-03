
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testAlternatives() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const models = ["gemini-flash-latest", "gemini-2.0-flash", "gemini-1.5-flash"];

    console.log('Testing alternative models...');

    for (const modelName of models) {
        console.log(`\nTesting: ${modelName}`);
        try {
            // Testing with v1beta as requested, but also can try v1 if this fails
            const model = genAI.getGenerativeModel({ model: modelName }, { apiVersion: 'v1beta' });
            const result = await model.generateContent('Hi');
            console.log(`✅ Success with ${modelName}`);
        } catch (e) {
            console.log(`❌ Failed with ${modelName}: ${e.message.split('\n')[0]}`);
        }
    }
}

testAlternatives();
