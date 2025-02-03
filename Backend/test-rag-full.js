
require('dotenv').config();
const documentProcessor = require('./src/services/rag/utils/documentProcessor');
const vectorStore = require('./src/services/rag/utils/vectorStore');
const geminiService = require('./src/services/rag/utils/geminiService');
const { v4: uuidv4 } = require('uuid');

async function testFullRag() {
    const userId = 'test-user-' + Date.now();
    const topicId = 'test-topic-' + Date.now();
    const collectionName = `user_${userId}_topic_${topicId}`;

    console.log(`Testing RAG with Collection: ${collectionName}`);

    try {
        // 1. Generate text and embedding
        const text = "The capital of France is Paris. Use this fact to answer questions.";
        const embedding = await geminiService.generateEmbedding(text);
        console.log(`1. Generated embedding: ${embedding.length} dimensions`);

        // 2. Index content (Manual addDocuments to check vectorStore directly)
        const docId = uuidv4();
        const documents = [{
            id: docId,
            content: text,
            metadata: { fileName: 'test.txt' },
            embedding: embedding
        }];

        console.log('2. Indexing document...');
        const addResult = await vectorStore.addDocuments(collectionName, documents);
        if (!addResult.success) throw new Error(addResult.error);
        console.log('✅ Indexing successful');

        // 3. Search
        console.log('3. Searching for "Capital of France"...');
        const queryEmbedding = await geminiService.generateEmbedding("Capital of France");
        const results = await vectorStore.search(collectionName, queryEmbedding, 5, 0.5);

        if (results.length > 0) {
            console.log(`✅ Search successful! Found ${results.length} results.`);
            console.log(`- Result: ${results[0].content}`);
        } else {
            console.error('❌ Search failed: No results found.');
        }

        // 4. Cleanup
        console.log('4. Cleaning up...');
        await vectorStore.deleteCollection(collectionName);
        console.log('✅ Cleanup successful');

    } catch (e) {
        console.error('❌ Full RAG Test Failed:', e);
    }
}

testFullRag();
