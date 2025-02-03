
require('dotenv').config();
const geminiService = require('./src/services/rag/utils/geminiService');

async function checkDimensions() {
    try {
        const embedding = await geminiService.generateEmbedding('Test');
        console.log('Embedding Dimensions:', embedding.length);
    } catch (e) {
        console.error('Error:', e);
    }
}
checkDimensions();
