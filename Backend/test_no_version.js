
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testNoVersion() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    console.log('Testing gemini-1.5-flash without explicit API version...');
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent('Hi');
        console.log('✅ Success with gemini-1.5-flash (no version specified)');
        console.log('Response:', result.response.text());
    } catch (e) {
        console.log(`❌ Failed: ${e.message}`);
    }
}

testNoVersion();
