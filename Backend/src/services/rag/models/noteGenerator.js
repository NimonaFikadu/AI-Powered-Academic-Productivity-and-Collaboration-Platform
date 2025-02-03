/**
 * Note Generator using RAG (Retrieval-Augmented Generation)
 * Generates educational notes based on retrieved context from materials
 */

const { Configuration, OpenAIApi } = require('openai');
const fs = require('fs');
const path = require('path');
const documentProcessor = require('../utils/documentProcessor');
const vectorStore = require('../utils/vectorStore');
const { format } = require('date-fns');
const { v4: uuidv4 } = require('uuid');
const geminiService = require('../utils/geminiService');
const { createComponentLogger, logOperation, logError, logAiError } = require('../../../utils/logger');
const { progressTracker, ProgressStatus } = require('../utils/ragProgressTracker');
const { retryWithBackoff, classifyError } = require('../../../utils/retryUtils');
const { canUseProvider, recordSuccess, recordFailure } = require('../utils/aiHealthCheck');

const logger = createComponentLogger('noteGenerator');

// Initialize OpenAI/OpenRouter configuration if API key is available
let openai = null;
if (process.env.OPENAI_API_KEY) {
  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
    basePath: 'https://openrouter.ai/api/v1',
    baseOptions: {
      headers: {
        "HTTP-Referer": "http://localhost",
        "X-Title": "UniHub",
      }
    }
  });
  openai = new OpenAIApi(configuration);
}

/**
 * Calculates estimated reading time for content
 * @param {string} content - Content to calculate reading time for
 * @returns {string} - Estimated reading time in minutes
 */
const calculateReadTime = (content) => {
  // Average reading speed: 200 words per minute
  const words = content.split(/\s+/).length;
  const minutes = Math.ceil(words / 200);
  return `${minutes} min read`;
};

/**
 * Indexes materials for a specific user and topic
 * @param {Array} materials - Array of material objects
 * @param {string} userId - User ID
 * @param {string} topicId - Topic ID
 * @param {number} maxMaterials - Maximum number of materials to process (default: 3)
 * @returns {Promise<Object>} - Indexing results
 */
const indexMaterials = async (materials, userId, topicId, maxMaterials = 3) => {
  const endOperation = logOperation('noteGenerator', 'indexMaterials', {
    userId,
    topicId,
    materialCount: materials.length,
    maxMaterials
  });

  try {
    // Create a unique collection name
    const collectionName = `user_${userId}_topic_${topicId}`;

    // Create collection in vector store
    const createResult = await vectorStore.createCollection(collectionName);

    // Keep track of indexing results
    const results = {
      collectionName,
      success: true,
      collectionCreated: createResult.created,
      collectionExisted: createResult.existed,
      materialsProcessed: 0,
      materialsAdded: 0,
      errors: []
    };

    // Limit the number of materials to process
    if (materials.length > maxMaterials) {
      logger.warn('Limiting materials for indexing', {
        originalCount: materials.length,
        limitedTo: maxMaterials,
        topicId
      });
      materials = materials.slice(0, maxMaterials);
    }

    // Start progress tracking
    progressTracker.startIndexing(userId, topicId, materials.length);

    logger.info('Starting material indexing', {
      userId,
      topicId,
      materialCount: materials.length,
      collectionName
    });

    // Process each material
    for (const material of materials) {
      // Check if we have the uploaded_file property (from direct DB query)
      // or file_name and other properties (from Sequelize model)
      const uploadedFileName = material.uploaded_file || material.file_name;
      const fileName = material.file_name || uploadedFileName;
      const filePath = path.join(__dirname, `../../../../uploads/materials/${userId}`, uploadedFileName);

      results.materialsProcessed++;

      // Update progress: extracting text
      progressTracker.updateMaterialProgress(
        userId,
        topicId,
        material.id,
        ProgressStatus.EXTRACTING,
        { fileName }
      );

      if (fs.existsSync(filePath)) {
        logger.debug('Processing material file', {
          materialId: material.id,
          fileName,
          fileType: material.file_type
        });

        // Add metadata to each document
        const metadata = {
          materialId: material.id,
          fileName: fileName,
          fileType: material.file_type,
          topicId: topicId,
          userId: userId
        };

        try {
          // Update progress: generating embeddings
          progressTracker.updateMaterialProgress(
            userId,
            topicId,
            material.id,
            ProgressStatus.EMBEDDING,
            { fileName }
          );

          // Process file and create embeddings - with a 90 second timeout
          const processPromise = documentProcessor.processFile(
            filePath,
            material.file_type,
            metadata
          );

          // Create a timeout promise
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Processing file timed out after 90 seconds')), 90000);
          });

          // Race the promises
          const documentsWithEmbeddings = await Promise.race([processPromise, timeoutPromise]);

          // Update progress: indexing
          progressTracker.updateMaterialProgress(
            userId,
            topicId,
            material.id,
            ProgressStatus.INDEXING,
            { fileName, chunksCount: documentsWithEmbeddings.length }
          );

          // Add documents to vector store
          const addResult = await vectorStore.addDocuments(collectionName, documentsWithEmbeddings);

          if (addResult.success) {
            results.materialsAdded++;
            progressTracker.completeMaterial(userId, topicId, material.id, true);
            logger.info('Material indexed successfully', {
              materialId: material.id,
              fileName,
              documentsAdded: addResult.documentsAdded
            });
          } else {
            results.errors.push({ materialId: material.id, error: addResult.error });
            progressTracker.completeMaterial(userId, topicId, material.id, false, addResult.error);
            logger.error('Failed to add material to vector store', {
              materialId: material.id,
              fileName,
              error: addResult.error
            });
          }
        } catch (err) {
          logError('noteGenerator', `Error processing material: ${fileName}`, err, {
            materialId: material.id,
            fileType: material.file_type
          });
          results.errors.push({ materialId: material.id, error: err.message });
          progressTracker.completeMaterial(userId, topicId, material.id, false, err.message);
        }
      } else {
        const errorMsg = 'File not found';
        logger.warn('Material file not found', {
          materialId: material.id,
          fileName,
          filePath
        });
        results.errors.push({ materialId: material.id, error: errorMsg });
        progressTracker.completeMaterial(userId, topicId, material.id, false, errorMsg);
      }
    }

    // Overall success based on at least some materials being added
    results.success = results.materialsAdded > 0;

    // Complete progress tracking
    progressTracker.completeIndexing(userId, topicId, results);

    logger.info('Material indexing completed', {
      userId,
      topicId,
      materialsProcessed: results.materialsProcessed,
      materialsAdded: results.materialsAdded,
      errors: results.errors.length,
      success: results.success
    });

    endOperation(true, {
      materialsAdded: results.materialsAdded,
      errors: results.errors.length
    });

    return results;
  } catch (error) {
    logError('noteGenerator', 'Error indexing materials', error, { userId, topicId });
    progressTracker.completeIndexing(userId, topicId, { success: false, error: error.message });
    endOperation(false, { error: error.message });

    return {
      collectionName: `user_${userId}_topic_${topicId}`,
      success: false,
      error: error.message
    };
  }
};

/**
 * Generates mock note content for development/testing
 * @param {string} title - Note title
 * @param {string} userGoal - User's goal
 * @param {Array} relevantDocs - Relevant documents
 * @returns {string} - Generated note content
 */
const generateMockNote = (title, userGoal, relevantDocs) => {
  console.log('[LOG note_generator] ========= Generating mock note (OpenAI API key not available)');

  // Extract some context from relevant documents if available
  let extractedContext = '';
  if (relevantDocs && relevantDocs.length > 0) {
    // Get up to 3 relevant documents
    const sampledDocs = relevantDocs.slice(0, Math.min(3, relevantDocs.length));
    extractedContext = sampledDocs.map(doc => {
      // Extract the first 100 characters from each document
      return doc.content.substring(0, 100) + '...';
    }).join('\n\n');
  }

  // Generate a simple structured note with markdown
  return `# ${title}

## Introduction

This is a mock note generated for: ${userGoal}

## Content from Materials

${extractedContext || 'No relevant materials were found.'}

## Key Points

- This is a mock note generated for testing purposes
- The RAG system can generate real notes when an active Gemini or OpenAI API key is configured
- Ensure you have a valid API key with sufficient quota in your .env file

## Summary

This note is a placeholder. To generate real notes using the RAG system, your backend requires a valid, active AI API key configuration.`;
};



/**
 * Generates a note using RAG approach
 * @param {Object} params - Note generation parameters
 * @param {string} params.title - Note title
 * @param {string} params.userGoal - User's goal for the note
 * @param {Array} params.materials - Materials to use for context
 * @param {string} params.userId - User ID
 * @param {string} params.topicId - Topic ID
 * @returns {Promise<Object>} - Generated note data
 */
const generateNote = async ({ title, userGoal, materials = [], userId, topicId }) => {
  try {
    console.log(`[LOG note_generator] ========= Starting note generation for "${title}"`);

    // Create a unique collection name directly
    const collectionName = `user_${userId}_topic_${topicId}`;

    // Index materials if there are any
    if (materials.length > 0) {
      console.log(`[LOG note_generator] ========= Indexing ${materials.length} materials`);
      const indexResult = await indexMaterials(materials, userId, topicId);
      console.log(`[LOG note_generator] ========= Indexing completed with status: ${indexResult.success ? 'success' : 'failure'}`);
    }

    // Generate embedding for the query (title + goal)
    console.log(`[LOG note_generator] ========= Generating embedding for query`);
    const query = `Title: ${title}. Goal: ${userGoal}`;
    const queryEmbedding = await documentProcessor.generateEmbedding(query);

    // Search for relevant documents
    console.log(`[LOG note_generator] ========= Searching for relevant documents in ${collectionName}`);
    const relevantDocs = await vectorStore.search(collectionName, queryEmbedding, 10, 0.4, 20000);

    // Extract context from relevant documents
    let context = "";
    if (relevantDocs.length > 0) {
      let currentContextLength = 0;
      const selectedChunks = [];
      let totalScore = 0;
      const MIN_CHUNKS = 2;
      const MAX_CHUNKS = 5;

      for (const doc of relevantDocs) {
        if (selectedChunks.length >= MAX_CHUNKS) break;
        
        const chunkText = `--- From: ${doc.metadata.fileName || 'Unknown source'} ---\n${doc.content}\n\n`;
        
        // Diversity check (avoid duplicates)
        const isDuplicate = selectedChunks.some(selected => 
          selected.slice(0, 100) === chunkText.slice(0, 100)
        );
        if (isDuplicate) continue;

        // Limit context size to ~2000 tokens (approx 8000 characters)
        if (currentContextLength + chunkText.length > 8000) continue;

        // Score filter with minimum context guarantee
        if (selectedChunks.length < MIN_CHUNKS || doc.score >= 0.6) {
          selectedChunks.push(chunkText);
          currentContextLength += chunkText.length;
          totalScore += doc.score;
        }
      }

      context = selectedChunks.length > 0 ? selectedChunks.join('') : "No supporting documents were found. Generate a general answer based on your pre-trained knowledge.";
      
      const avgScore = selectedChunks.length > 0 ? (totalScore / selectedChunks.length).toFixed(4) : 0;
      console.log("[RAG] Selected chunks:", selectedChunks.length);
      console.log("[RAG] Avg score:", avgScore);
    } else {
      context = "No supporting documents were found. Generate a general answer based on your pre-trained knowledge.";
    }

    const prompt = `You are an expert educational note-generator. For the title "${title}" and user goal "${userGoal}", create a comprehensive educational note using the following context from learning materials:

${context}

Structure the note with clear headers, subheaders, and sections. Include examples and explanations.
DO NOT include any greetings, explanations, or conversation - ONLY return the note content in markdown format.`;

    let noteContent;

    // Prioritize Gemini for content generation
    if (!canUseProvider('gemini')) {
      console.log(`[AI] Skipping Gemini (Rate limited or Unconfigured)`);
    } else {
      console.log(`[AI] Trying Gemini...`);
      try {
        noteContent = await retryWithBackoff(
        async () => await geminiService.generateContent(prompt),
        {
          maxRetries: 2,
          baseDelay: 1000,
          retryableErrors: ['rate limit', '503', '504', 'timeout']
        },
        'Gemini note generation'
      );
        recordSuccess();
        console.log(`[AI] Gemini success ✅`);
      } catch (error) {
        const errorType = classifyError(error);
        recordFailure('gemini', errorType);
        
        const status = error.response ? error.response.status : (error.status || 'unknown');
        
        logAiError({
          provider: 'gemini',
          userId,
          endpoint: '/rag/notes',
          errorType,
          message: error.message
        });
        console.log(`[AI] Gemini failed`);
        console.log(`[AI] Gemini quota status: ${status}`);
      }
    }

    // Fallback to OpenRouter if Gemini failed
    if (!noteContent && !canUseProvider('openrouter')) {
      console.log(`[AI] Skipping OpenRouter (Rate limited or Unconfigured)`);
    } else if (!noteContent && canUseProvider('openrouter')) {
      console.log(`[AI] Trying OpenRouter...`);
      try {
        if (!process.env.OPENAI_API_KEY) throw new Error('API key not configured');
        if (!openai) throw new Error('OpenRouter client failed to initialize');
        
        const systemMessage = "You are an expert educational note-generator. Create a comprehensive note based on provided context. Return ONLY markdown.";
        
        let model = 'openai/gpt-4o-mini'; // Switched to highly reliable premium router model
        if (process.env.AI_MODE === 'cheap') model = 'google/gemma-2-9b-it:free';
        else if (process.env.AI_MODE === 'premium') model = 'openai/gpt-4o-mini';

        const completion = await retryWithBackoff(
          async () => {
            return await Promise.race([
              openai.createChatCompletion({
                model: model,
                messages: [
                  { role: 'system', content: systemMessage },
                  { role: 'user', content: prompt }
                ],
                temperature: 0.7,
                max_tokens: 3000
              }),
              new Promise((_, reject) =>
                setTimeout(() => reject(new Error('timeout')), 10000)
              )
            ]);
          },
          {
            maxRetries: 2,
            baseDelay: 1000,
            retryableErrors: ['rate limit', '503', '504', 'timeout']
          },
          'OpenRouter note generation'
        );
        noteContent = completion.data.choices[0].message.content;
        recordSuccess();
        console.log(`[AI] OpenRouter success ✅`);
      } catch (error) {
        const errorType = classifyError(error);
        recordFailure('openrouter', errorType);
        
        logAiError({
          provider: 'openrouter',
          userId,
          endpoint: '/rag/notes',
          errorType,
          message: error.message
        });
        console.log(`[AI] OpenRouter failed`);
      }
    }

    // Both providers failed - Guaranteed final fallback response instead of crash
    if (!noteContent) {
      logger.warn('All AI providers exhausted, using guaranteed basic fallback', { userId, topicId });
      noteContent = `## Important Subject Note\n\nWe couldn't access our advanced AI learning services right now due to extreme network load. \n\nHowever, you can still study the core concepts surrounding **${title}** directly from any documents you've uploaded or by reviewing the primary syllabus materials attached to this topic. \n\nPlease try recreating this note in a few minutes when the service is fully restored!`;
    }

    // Calculate reading time
    const readTime = calculateReadTime(noteContent);

    // Create note data object
    const note = {
      id: uuidv4(),
      title,
      userGoal,
      content: noteContent,
      readTime,
      date: format(new Date(), 'MMM d, yyyy'),
      topicId,
      userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log(`[LOG note_generator] ========= Note generation completed successfully`);
    return note;
  } catch (error) {
    console.error('[LOG note_generator] ========= Error generating note:', error);
    throw new Error(`Failed to generate note: ${error.message}`);
  }
};


/**
 * Handles a chat conversation with context from materials in a topic
 * @param {Object} params - Chat parameters
 * @param {string} params.message - User message
 * @param {string} params.userId - User ID
 * @param {string|null} params.topicId - Topic ID (optional)
 * @param {Array} params.previousMessages - Previous messages in the conversation
 * @returns {Promise<string>} - Assistant response
 */
const chatWithTopic = async ({ message, userId, topicId, previousMessages = [] }) => {
  try {
    console.log(`[LOG chat_with_topic] ========= Starting chat ${topicId ? `for topic ${topicId}` : '(general academic chat)'}`);
    const startTime = Date.now();

    let relevantDocs = [];
    let context = "No relevant materials found.";

    // Only search for relevant documents if topicId is provided
    if (topicId) {
      // Create a unique collection name (same format as indexMaterials)
      const collectionName = `user_${userId}_topic_${topicId}`;
      console.log(`[LOG chat_with_topic] ========= Using collection: ${collectionName}`);

      // Generate embedding for the query
      console.log(`[LOG chat_with_topic] ========= Generating embedding for user query`);
      const queryEmbedding = await documentProcessor.generateEmbedding(message);
      console.log(`[LOG chat_with_topic] ========= Embedding generated successfully`);

      // Search for relevant documents - use a faster timeout for chat (10 seconds)
      console.log(`[LOG chat_with_topic] ========= Searching for relevant context in ${collectionName}`);
      relevantDocs = await vectorStore.search(collectionName, queryEmbedding, 10, 0.4, 10000);
      console.log(`[LOG chat_with_topic] ========= Found ${relevantDocs.length} relevant document chunks in ${(Date.now() - startTime) / 1000}s`);

      // Extract context from relevant documents
      if (relevantDocs.length > 0) {
        let currentContextLength = 0;
        const selectedChunks = [];
        let totalScore = 0;
        const MIN_CHUNKS = 2;
        const MAX_CHUNKS = 5;

        for (const doc of relevantDocs) {
          if (selectedChunks.length >= MAX_CHUNKS) break;
          
          const chunkText = `--- From: ${doc.metadata.fileName || 'Unknown source'} ---\n${doc.content}\n\n`;
          
          // Diversity check (avoid duplicates)
          const isDuplicate = selectedChunks.some(selected => 
            selected.slice(0, 100) === chunkText.slice(0, 100)
          );
          if (isDuplicate) continue;

          // Limit context size to ~2000 tokens (approx 8000 characters)
          if (currentContextLength + chunkText.length > 8000) continue;

          // Score filter with minimum context guarantee
          if (selectedChunks.length < MIN_CHUNKS || doc.score >= 0.6) {
            selectedChunks.push(chunkText);
            currentContextLength += chunkText.length;
            totalScore += doc.score;
          }
        }

        context = selectedChunks.length > 0 ? selectedChunks.join('') : "No relevant materials found.";
        
        const avgScore = selectedChunks.length > 0 ? (totalScore / selectedChunks.length).toFixed(4) : 0;
        console.log("[RAG] Selected chunks:", selectedChunks.length);
        console.log("[RAG] Avg score:", avgScore);
      }
    } else {
      console.log(`[LOG chat_with_topic] ========= No topicId provided, using general academic chat`);
    }

    const prompt = topicId
      ? `Here is context from my learning materials:\n\n${context}\n\nBased on this context, please answer my question: ${message}`
      : message;

    let responseContent;

    // Prioritize Gemini for chat — use canUseProvider to respect cooldown tracking
    if (!canUseProvider('gemini')) {
      console.log(`[AI] Skipping Gemini (Rate limited or Unconfigured)`);
    } else {
      console.log(`[AI] Trying Gemini...`);
      try {
        const systemMessage = topicId
          ? "You are an expert academic tutor. The user has provided you with extracted context from their learning materials. ALWAYS act as if you have fully read and understood their entire document. NEVER mention that you are only receiving 'snippets', 'chunks', or 'limited context'. Answer their questions confidently based on the provided context using markdown."
          : "You are an expert academic tutor. Answer comprehensively using markdown.";

        // Combining history with current prompt for Gemini
        const historyPrompt = previousMessages.map(m => `${m.role}: ${m.content}`).join('\n');
        const fullPrompt = `${systemMessage}\n\nHistory:\n${historyPrompt}\n\nQuery: ${prompt}`;

        responseContent = await retryWithBackoff(
          async () => await geminiService.generateContent(fullPrompt),
          {
            maxRetries: 2,
            baseDelay: 1000,
            retryableErrors: ['rate limit', '503', '504', 'timeout']
          },
          'Gemini chat response'
        );
        recordSuccess();
        console.log(`[AI] Gemini success ✅`);
      } catch (error) {
        const errorType = classifyError(error);
        recordFailure('gemini', errorType);
        logAiError({
          provider: 'gemini',
          userId,
          endpoint: '/rag/chat',
          errorType,
          message: error.message
        });
        console.log(`[AI] Gemini failed (${errorType}): ${error.message && error.message.substring(0, 80)}`);
      }
    }

    // Fallback to OpenRouter if Gemini failed or is not available
    if (!responseContent && !canUseProvider('openrouter')) {
      console.log(`[AI] Skipping OpenRouter (Rate limited or Unconfigured)`);
    } else if (!responseContent && canUseProvider('openrouter')) {
      console.log(`[AI] Trying OpenRouter...`);
      try {
        if (!process.env.OPENAI_API_KEY) throw new Error('API key not configured');
        if (!openai) throw new Error('OpenRouter client failed to initialize');

        const formattedPreviousMessages = previousMessages.map(msg => ({
          role: msg.role,
          content: msg.content
        }));

        const systemMessage = topicId
          ? "You are an expert academic tutor. The user has provided you with extracted context from their learning materials. ALWAYS act as if you have fully read and understood their entire document. NEVER mention that you are only receiving 'snippets', 'chunks', or 'limited context'. Answer their questions confidently based on the provided context using markdown."
          : "You are an expert academic tutor. Answer using markdown.";

        // Model waterfall: try smaller/less congested free models first
        const OR_CHAT_MODELS = [
          'meta-llama/llama-3.1-8b-instruct:free',
          'microsoft/phi-3-mini-128k-instruct:free',
          'meta-llama/llama-3.2-3b-instruct:free',
        ];

        for (const orModel of OR_CHAT_MODELS) {
          if (responseContent) break;
          try {
            console.log(`[AI] OpenRouter attempting model: ${orModel}`);
            const completion = await retryWithBackoff(
              async () => {
                return await Promise.race([
                  openai.createChatCompletion({
                    model: orModel,
                    messages: [
                      { role: 'system', content: systemMessage },
                      ...formattedPreviousMessages,
                      { role: 'user', content: prompt }
                    ],
                    temperature: 0.3,
                    max_tokens: 2000
                  }),
                  new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('OpenRouter request timed out after 30 seconds')), 30000)
                  )
                ]);
              },
              {
                maxRetries: 1,
                baseDelay: 1000,
                retryableErrors: ['503', '504']
              },
              `OpenRouter chat (${orModel})`
            );
            responseContent = completion.data.choices[0].message.content;
            recordSuccess();
            console.log(`[AI] OpenRouter success ✅ (${orModel})`);
          } catch (modelErr) {
            console.log(`[AI] OpenRouter model ${orModel} failed: ${modelErr.message && modelErr.message.substring(0, 60)}`);
          }
        }

        if (!responseContent) {
          throw new Error('All OpenRouter models exhausted');
        }
      } catch (error) {
        const errorType = classifyError(error);
        recordFailure('openrouter', errorType);
        logAiError({
          provider: 'openrouter',
          userId,
          endpoint: '/rag/chat',
          errorType,
          message: error.message
        });
        console.log(`[AI] OpenRouter failed`);
      }
    }

    if (responseContent) {
      console.log(`[LOG chat_with_topic] ========= Chat response generated successfully`);
      return responseContent;
    }

    // Both providers failed — throw a real error, never silently swallow it
    throw new Error('AI service temporarily unavailable. Please try again later.');
  } catch (error) {
    console.error('[LOG chat_with_topic] ========= Error in chat function:', error);
    throw new Error(`Failed to generate chat response: ${error.message}`);
  }
};

module.exports = {
  generateNote,
  calculateReadTime,
  indexMaterials,
  generateMockNote,
  chatWithTopic
}; 