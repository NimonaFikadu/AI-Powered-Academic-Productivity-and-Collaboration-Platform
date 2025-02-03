
require('dotenv').config();
const ragService = require('./src/services/rag');

async function testSearch() {
    const userId = '73f4f75d-21eb-4375-9384-ae3e66bedca0';
    const topicId = '5d29785c-6bb4-4ca4-b9ba-f4aa3f6b2355';

    console.log('Testing Search for User:', userId, 'Topic:', topicId);

    const queries = [
        "can you tell me about my material",
        "software metrics",
        "what is defect removal efficiency"
    ];

    for (const query of queries) {
        console.log(`\n\nQuery: "${query}"`);
        try {
            const results = await ragService.searchMaterials(query, userId, topicId);
            console.log(`Found ${results.length} results.`);
            if (results.length > 0) {
                console.log('Top Result Score:', results[0].score);
                console.log('Top Result Content:', results[0].content.substring(0, 100) + '...');
            }
        } catch (e) {
            console.error('Search Failed:', e.message);
        }
    }
}
testSearch();
