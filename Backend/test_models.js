
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function listModels() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    /* 
       Note: The GoogleGenerativeAI SDK for Node.js doesn't seem to have a direct listModels method on the client itself in older versions, 
       but let's try to see if we can access it or just test a few common model names.
       Actually, for the SDK, we might not be able to list models easily without a specific call.
       Let's try to query the specialized `getGenerativeModel` with a few variants if listing isn't straightforward.
       
       However, the error message said: "Call ListModels to see the list of available models".
       Let's try to use the raw API or a known method if available.
       Since I can't easily look up the SDK version docs right now, I'll try a different approach:
       I will try to use `gemini-1.5-flash-001` which is a specific version.
       
       But first, let's just logging what we have.
    */
    console.log('Checking model names...');
    const models = ["gemini-1.5-flash", "gemini-1.5-flash-001", "gemini-1.5-flash-latest", "gemini-pro", "gemini-1.0-pro"];

    for (const modelName of models) {
        console.log(`Testing model: ${modelName}`);
        try {
            const model = genAI.getGenerativeModel({ model: modelName }, { apiVersion: 'v1beta' });
            const result = await model.generateContent('Hi');
            console.log(`✅ Success with ${modelName}`);
            break; // Found one that works
        } catch (e) {
            console.log(`❌ Failed with ${modelName}: ${e.message.split('\n')[0]}`);
        }
    }
}

listModels();
