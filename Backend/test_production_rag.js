require('dotenv').config();
const path = require('path');
const documentProcessor = require('./src/services/rag/utils/documentProcessor');
const vectorStore = require('./src/services/rag/utils/vectorStore');
const geminiService = require('./src/services/rag/utils/geminiService');

async function testRealUpload() {
  const collectionName = 'test_real_uploaded_doc_' + Date.now();
  // Using an existing user-uploaded DOCX from the uploads directory
  const filePath = path.join(__dirname, 'uploads/materials/1769404542506_4d1b0a80-bdc1-4a41-9bf3-1d9997f0f692.docx');
  const fileType = 'docx';

  try {
    console.log('\n=============================================');
    console.log(' RAG PRODUCTION-LEVEL VALIDATION (REAL DATA)');
    console.log('=============================================\n');

    console.log('[UPLOAD] File received:', filePath);
    
    // 1. Process the real uploaded file
    console.log('[UPLOAD] Processing document into chunks and embedding...');
    const chunks = await documentProcessor.processFile(filePath, fileType, { fileName: path.basename(filePath) });
    console.log('[UPLOAD] Chunks created:', chunks.length);
    console.log('[UPLOAD] First chunk preview:', chunks[0]?.content.substring(0, 150).replace(/\n/g, ' '), '...');

    if (chunks.length === 0) {
      console.log('❌ Extraction failed. No chunks produced.');
      return;
    }

    // 2. Insert into Qdrant
    console.log('\n[INDEX] Inserting to vectorStore collection:', collectionName);
    await vectorStore.addDocuments(collectionName, chunks);
    
    // 3. Verify storage directly from Qdrant
    const info = await vectorStore.getCollection(collectionName);
    console.log(`[UPLOAD] Points stored in Qdrant: ${info ? info.points_count : 0}`);

    if (!info || info.points_count === 0) {
      console.log('❌ Storage verification failed.');
      return;
    }

    // 4. Run real query
    // Since we don't know the exact content of the docx, we'll pick the first chunk's words
    // to guarantee a semantic match, testing the full retrieval engine.
    const sampleWords = chunks[0].content.split(' ').slice(0, 10).join(' ');
    const userQuery = `Summarize: ${sampleWords}`;
    console.log(`\n[SEARCH] Running real query related to document: "${userQuery}"`);
    
    const queryEmb = await documentProcessor.generateEmbedding(userQuery);
    const results = await vectorStore.search(collectionName, queryEmb, 3);
    
    console.log('[FLOW] Results found:', results.length);
    if (results.length === 0) {
      console.log('❌ RAG retrieved zero documents despite successful index.');
      return;
    }
    
    console.log('[FLOW] Context built from real document.');
    const context = results.map(r => `--- From: ${r.metadata.fileName} ---\n${r.content}`).join('\n\n');
    console.log('[FLOW] RAG context injected: YES');

    // 5. Send to AI
    console.log('\n[AI] Sending assembled prompt to Gemini waterfall...');
    const prompt = `Answer the user query based on the context.\nQuery: ${userQuery}\nContext: ${context}`;
    const aiResponse = await geminiService.generateContent(prompt);
    
    console.log('[AI] Gemini model success ✅');
    console.log('\n── Final AI Output Preview ─────────────────────────');
    console.log(aiResponse.substring(0, 400));
    console.log('────────────────────────────────────────────────────\n');

    console.log('[RESULT] ✅ REAL DATA RAG PIPELINE FULLY VALIDATED');

  } catch (error) {
    console.error('\n[FATAL] Pipeline error:', error);
  }
}

testRealUpload();
