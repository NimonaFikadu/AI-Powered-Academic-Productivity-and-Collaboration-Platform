/**
 * Document Processor for RAG Architecture
 * Handles text extraction, chunking, and embedding generation
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const readFileAsync = promisify(fs.readFile);
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const { v4: uuidv4 } = require('uuid');
const { Configuration, OpenAIApi } = require('openai');
const geminiService = require('./geminiService');
const { createComponentLogger, logOperation, logError } = require('../../../utils/logger');
const { retryWithBackoff } = require('../../../utils/retryUtils');

const logger = createComponentLogger('documentProcessor');

// Initialize OpenAI configuration if API key is available
let openai = null;
if (process.env.OPENAI_API_KEY) {
  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });
  openai = new OpenAIApi(configuration);
}

/**
 * Extracts text content from various file types
 * @param {string} filePath - Path to the file
 * @param {string} fileType - Type of the file (pdf, docx, etc.)
 * @returns {Promise<string>} - Extracted text content
 */
const extractTextFromFile = async (filePath, fileType) => {
  const endOperation = logOperation('documentProcessor', 'extractText', {
    filePath: path.basename(filePath),
    fileType
  });

  try {
    // Validate file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }


    // Check file is readable
    try {
      fs.accessSync(filePath, fs.constants.R_OK);
    } catch (err) {
      throw new Error(`File is not readable: ${filePath}`);
    }

    let text = '';

    switch (fileType) {
      case 'pdf':
        logger.debug('Extracting text from PDF', { filePath: path.basename(filePath) });
        const pdfBuffer = await readFileAsync(filePath);
        const pdfData = await pdfParse(pdfBuffer);
        text = pdfData.text;
        break;
      case 'docx':
        logger.debug('Extracting text from DOCX', { filePath: path.basename(filePath) });
        const docxBuffer = await readFileAsync(filePath);
        const docxResult = await mammoth.extractRawText({ buffer: docxBuffer });
        text = docxResult.value;
        break;
      case 'image':
        logger.warn('Image processing not yet implemented', { filePath: path.basename(filePath) });
        text = `[Image: ${path.basename(filePath)}]`;
        break;
      case 'ppt':
        logger.warn('PPT processing not yet implemented', { filePath: path.basename(filePath) });
        text = `[PowerPoint: ${path.basename(filePath)}]`;
        break;
      default:
        logger.warn('Unsupported file type', { fileType, filePath: path.basename(filePath) });
        text = `[Unsupported file type: ${fileType}]`;
    }

    endOperation(true, { textLength: text.length });
    return text;
  } catch (error) {
    logError('documentProcessor', `Failed to extract text from ${path.basename(filePath)}`, error, { fileType });
    endOperation(false, { error: error.message });
    return `[Error extracting content from file: ${path.basename(filePath)}]`;
  }
};

/**
 * Splits text into chunks of specified size with overlap
 * @param {string} text - Text to split into chunks
 * @param {number} chunkSize - Maximum number of characters per chunk
 * @param {number} overlap - Number of characters to overlap between chunks
 * @returns {Array<{id: string, content: string, metadata: Object}>} - Array of chunks
 */
const splitTextIntoChunks = (text, chunkSize = 1000, overlap = 200, metadata = {}) => {
  if (!text || text.length === 0) {
    return [];
  }

  // Split by paragraphs first to maintain coherence
  const paragraphs = text.split(/\n\s*\n/);
  const chunks = [];
  let currentChunk = '';

  for (const paragraph of paragraphs) {
    // If adding this paragraph would exceed chunk size, store current chunk and start a new one
    if (currentChunk.length + paragraph.length > chunkSize && currentChunk.length > 0) {
      chunks.push({
        id: uuidv4(),
        content: currentChunk.trim(),
        metadata: { ...metadata }
      });
      // Start new chunk with overlap from the end of the previous chunk
      const overlapText = currentChunk.length > overlap
        ? currentChunk.slice(-overlap)
        : currentChunk;
      currentChunk = overlapText + " " + paragraph;
    } else {
      // Add the paragraph to the current chunk
      currentChunk += (currentChunk ? "\n\n" : "") + paragraph;
    }
  }

  // Add the last chunk if it's not empty
  if (currentChunk.trim().length > 0) {
    chunks.push({
      id: uuidv4(),
      content: currentChunk.trim(),
      metadata: { ...metadata }
    });
  }

  return chunks;
};

/**
 * Generates a mock embedding vector for development/testing
 * @param {number} dimensions - Number of dimensions for the embedding
 * @returns {Array<number>} - Mock embedding vector
 */
// NOTE: Must match vectorStore.vectorSize (3072 for gemini-embedding-001, confirmed).
// Only use for local development / testing when no API key is present.
const generateMockEmbedding = (dimensions = 3072) => {
  console.log(`[LOG document_processor] ========= Generating mock embedding (${dimensions} dimensions)`);
  const embedding = new Array(dimensions).fill(0).map(() => Math.random() * 2 - 1);

  // Normalize the embedding vector
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  return embedding.map(val => val / magnitude);
};

/**
 * Generates embeddings for text list using Gemini API with retry mechanism
 * @param {string} text - Text to embed
 * @param {number} timeoutMs - Timeout in milliseconds (default: 15000)
 * @returns {Promise<Array<number>>} - Embedding vector
 */
const generateEmbedding = async (text, timeoutMs = 15000) => {
  const endOperation = logOperation('documentProcessor', 'generateEmbedding', {
    textLength: text.length,
    timeoutMs
  });

  try {
    // Try with retry logic using retryWithBackoff
    const embedding = await retryWithBackoff(
      async () => {
        // Prioritize Gemini for embeddings (Free tier, better rate limits)
        if (process.env.GEMINI_API_KEY) {
          logger.debug('Generating Gemini embedding');

          // Create a timeout promise
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error(`Gemini embedding request timed out after ${timeoutMs}ms`)), timeoutMs);
          });

          // Race the promises
          const result = await Promise.race([
            geminiService.generateEmbedding(text.trim().replace(/\n+/g, ' ').slice(0, 10000)),
            timeoutPromise
          ]);

          logger.debug('Gemini embedding generated successfully');
          return result;
        }

        // Fallback to OpenAI if Gemini is not available but OpenAI is
        if (openai) {
          logger.debug('Generating OpenAI embedding (fallback)');

          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error(`OpenAI embedding request timed out after ${timeoutMs}ms`)), timeoutMs);
          });

          const response = await Promise.race([
            openai.createEmbedding({
              model: 'text-embedding-ada-002',
              input: text.trim().replace(/\n+/g, ' ').slice(0, 8000),
            }),
            timeoutPromise
          ]);

          logger.debug('OpenAI embedding generated successfully');
          return response.data.data[0].embedding;
        }

        // No API keys available
        throw new Error('No AI API keys available');
      },
      {
        maxRetries: 3,
        baseDelay: 2000,
        retryableErrors: ['rate limit', '429', '503', '504', 'timeout', 'too many requests', 'fetch failed', 'fetch', 'econnreset', 'econnrefused', 'enotfound']
      },
      'Embedding generation'
    );

    logger.debug(`[RAG] Embedding generated (${embedding.length} dimensions)`);
    endOperation(true, { dimensions: embedding.length });
    return embedding;
  } catch (error) {
    // Do NOT silently fall back to mock embeddings in production —
    // inserting mock vectors into Qdrant pollutes the index with noise
    // and can cause silent dimension mismatches if the mock default changes.
    logger.error('[RAG] Embedding generation failed — NOT falling back to mock', { error: error.message });
    console.error(`[RAG] Embedding generation FAILED: ${error.message}`);
    endOperation(false, { error: error.message });
    throw error; // Surface the real error to the caller
  }
};

/**
 * Processes a file into chunks with embeddings
 * @param {string} filePath - Path to the file
 * @param {string} fileType - Type of the file
 * @param {Object} metadata - Metadata to associate with chunks
 * @param {number} maxChunks - Maximum number of chunks to process (default: 25)
 * @returns {Promise<Array<Object>>} - Array of chunks with embeddings
 */
const processFile = async (filePath, fileType, metadata = {}, maxChunks = 25) => {
  const fileName = path.basename(filePath);
  const endOperation = logOperation('documentProcessor', 'processFile', {
    fileName,
    fileType,
    maxChunks
  });

  try {
    logger.info('Starting document processing', { fileName, fileType });
    const startTime = Date.now();

    // Extract text from file
    const text = await extractTextFromFile(filePath, fileType);
    logger.debug('Text extraction completed', {
      fileName,
      textLength: text.length,
      duration: (Date.now() - startTime) / 1000
    });

    // Split text into chunks
    const chunkStartTime = Date.now();
    let chunks = splitTextIntoChunks(text, 1000, 200, metadata);
    logger.debug('Text splitting completed', {
      fileName,
      chunksCreated: chunks.length,
      duration: (Date.now() - chunkStartTime) / 1000
    });

    // Limit the number of chunks to process for large documents
    if (chunks.length > maxChunks) {
      logger.warn('Limiting chunks for large document', {
        fileName,
        originalChunks: chunks.length,
        limitedTo: maxChunks
      });
      chunks = chunks.slice(0, maxChunks);
    }

    // Generate embeddings for each chunk
    logger.info('Starting embeddings generation', {
      fileName,
      chunksToProcess: chunks.length
    });

    const embeddingStartTime = Date.now();
    const chunksWithEmbeddings = [];

    // Process chunks in batches to avoid overwhelming the API
    const BATCH_SIZE = 5;
    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batchStartTime = Date.now();
      const batch = chunks.slice(i, Math.min(i + BATCH_SIZE, chunks.length));
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(chunks.length / BATCH_SIZE);

      logger.debug('Processing embedding batch', {
        fileName,
        batchNumber,
        totalBatches,
        batchSize: batch.length
      });

      // Process each chunk in the batch
      const batchResults = await Promise.all(
        batch.map(async (chunk, index) => {
          const embedding = await generateEmbedding(chunk.content);
          // generateEmbedding now throws on failure — no silent mock fallback.
          // Caller (indexMaterials) will catch and report the real error.
          return { ...chunk, embedding };
        })
      );

      chunksWithEmbeddings.push(...batchResults);

      logger.debug('Batch processing completed', {
        fileName,
        batchNumber,
        duration: (Date.now() - batchStartTime) / 1000
      });
    }

    const totalDuration = (Date.now() - startTime) / 1000;
    logger.info('Document processing completed', {
      fileName,
      totalChunks: chunksWithEmbeddings.length,
      totalDuration
    });

    endOperation(true, {
      chunksProcessed: chunksWithEmbeddings.length,
      duration: totalDuration
    });

    return chunksWithEmbeddings;
  } catch (error) {
    logError('documentProcessor', `Failed to process file: ${fileName}`, error, { fileType });
    endOperation(false, { error: error.message });
    throw error;
  }
};

module.exports = {
  extractTextFromFile,
  splitTextIntoChunks,
  generateEmbedding,
  generateMockEmbedding,
  processFile
}; 