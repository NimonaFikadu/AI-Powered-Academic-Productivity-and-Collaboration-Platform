/**
 * Vector Store for RAG Architecture
 * Manages vector embeddings for documents and retrieval by similarity using Qdrant.
 */

const { QdrantClient } = require('@qdrant/js-client-rest');
const { v4: uuidv4 } = require('uuid');
const { createComponentLogger, logOperation, logError } = require('../../../utils/logger');
const { retryWithBackoff, retryWithTimeout } = require('../../../utils/retryUtils');
const { Agent } = require('undici');

const logger = createComponentLogger('vectorStore');

// Custom fetch to force IPv4 resolution - fixes Node 18+ native fetch timeouts
// against Qdrant Cloud which hangs when preferring IPv6 on Windows proxy setups
const ipv4Dispatcher = new Agent({
  connect: {
    lookup: (hostname, options, callback) => {
      require('dns').lookup(hostname, { family: 4 }, callback);
    }
  }
});

const customFetch = (url, init = {}) => {
  return fetch(url, { ...init, dispatcher: ipv4Dispatcher });
};

class QdrantVectorStore {
  constructor() {
    // Initialize Qdrant client with details from environment variables
    const qdrantUrl = process.env.QDRANT_URL || '';
    const qdrantApiKey = process.env.QDRANT_API_KEY;

    if (!qdrantUrl || !qdrantApiKey) {
      logger.error('Missing Qdrant configuration', {
        hasUrl: !!qdrantUrl,
        hasApiKey: !!qdrantApiKey
      });
    } else {
      logger.info('Initializing Qdrant client', {
        url: qdrantUrl,
        apiKeyLength: qdrantApiKey.length
      });
    }

    // Standard Qdrant SDK initialization with IPv4 injection
    this.client = new QdrantClient({
      url: qdrantUrl,
      apiKey: qdrantApiKey,
      checkCompatibility: false,
      fetch: customFetch
    });

    // CONFIRMED by live probe: gemini-embedding-001 (v1beta) returns EXACTLY 3072 dimensions.
    // OpenAI text-embedding-ada-002 fallback returns 1536 dimensions.
    // Collections MUST be created with 3072 to match the primary provider.
    this.vectorSize = 3072;
    this.initialized = false;
    this.connectionHealthy = false;
    // Do not call this.initialize() here to avoid race conditions during import
  }

  /**
   * Initialize the Qdrant connection by retrieving collections list
   * @returns {Promise<boolean>} - Whether initialization was successful
   */
  async initialize() {
    const endOperation = logOperation('vectorStore', 'initialize');

    if (this.initialized) {
      endOperation(true, { alreadyInitialized: true });
      return true;
    }

    try {
      // Test connection by fetching collections
      await retryWithBackoff(
        async () => await this.client.getCollections(),
        { maxRetries: 4, baseDelay: 1000 },
        'Qdrant initialization'
      );

      this.initialized = true;
      this.connectionHealthy = true;
      logger.info('Connected to Qdrant successfully');
      endOperation(true);
      return true;
    } catch (error) {
      this.connectionHealthy = false;
      logError('vectorStore', 'Failed to initialize Qdrant connection', error);
      endOperation(false, { error: error.message });
      return false;
    }
  }

  /**
   * Check connection health, attempting to reconnect if needed
   * @returns {Promise<boolean>} - Connection health status
   */
  async checkHealth() {
    try {
      // Try to re-initialize if not healthy
      if (!this.connectionHealthy) {
        return await this.initialize();
      }

      // Fast check
      await this.client.getCollections();
      return true;
    } catch (error) {
      this.connectionHealthy = false;
      logger.warn('Qdrant health check failed', { error: error.message });
      return false;
    }
  }

  /**
   * Generates a predictable UUID from a string if it's not already a valid UUID
   * Qdrant requires string IDs to be valid UUIDs
   */
  generatePointId(id) {
    // Check if it's already a valid UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(id)) {
      return id;
    }

    // Generate a fresh UUID - Qdrant will store the original ID in the payload
    // We don't try to hash since it might result in identical embeddings
    // having identical IDs, which Qdrant will overwrite
    return uuidv4();
  }

  /**
   * Ensures a collection exists or creates it
   * @param {string} collectionName - Name of the collection
   * @returns {Promise<Object>} - Success status
   */
  async createCollection(collectionName) {
    const endOperation = logOperation('vectorStore', 'createCollection', { collectionName });

    try {
      // Check connection health first
      if (!this.connectionHealthy) {
        const isHealthy = await this.checkHealth();
        if (!isHealthy) {
          throw new Error('Qdrant connection is not healthy');
        }
      }

      // Check if collection exists (with retry)
      const collections = await retryWithBackoff(
        async () => await this.client.getCollections(),
        { maxRetries: 2 },
        'Get collections list'
      );

      const exists = collections.collections.some(c => c.name === collectionName);

      if (exists) {
        // --- Stale-collection check ---
        // If the existing collection was created with the wrong vector size (e.g.
        // the old hardcoded 3072), delete it and recreate it with the correct size
        // so that embeddings can actually be stored and searched.
        try {
          const collectionInfo = await this.client.getCollection(collectionName);
          const existingSize = collectionInfo?.config?.params?.vectors?.size;
          if (existingSize && existingSize !== this.vectorSize) {
            logger.warn(
              `[RAG] Collection ${collectionName} has wrong vector size (${existingSize} vs expected ${this.vectorSize}). Deleting and recreating.`,
              { collectionName, existingSize, expectedSize: this.vectorSize }
            );
            console.warn(`[RAG] Recreating collection with correct size: ${collectionName} (${existingSize} -> ${this.vectorSize})`);
            await this.client.deleteCollection(collectionName);
            logger.info(`[RAG] Old collection deleted`, { collectionName });
            // Fall through to create the collection with correct size below
          } else {
            logger.debug('Collection exists with correct vector size', { collectionName, vectorSize: existingSize });
            endOperation(true, { existed: true });
            return { success: true, created: false, existed: true };
          }
        } catch (infoError) {
          // If we cannot fetch info, log but don't crash — attempt to use as-is
          logger.warn('Could not verify existing collection vector size — using as-is', {
            collectionName,
            error: infoError.message
          });
          endOperation(true, { existed: true });
          return { success: true, created: false, existed: true };
        }
      }

      // Create collection with the correct vector size
      logger.info(`[RAG] Creating collection with vectorSize=${this.vectorSize}`, { collectionName });
      console.log(`[RAG] Creating Qdrant collection: ${collectionName} (vectorSize=${this.vectorSize})`);

      await retryWithBackoff(
        async () => await this.client.createCollection(collectionName, {
          vectors: {
            size: this.vectorSize,
            distance: 'Cosine'
          },
          optimizers_config: {
            default_segment_number: 2
          },
          replication_factor: 1
        }),
        { maxRetries: 3, baseDelay: 1000 },
        `Create collection ${collectionName}`
      );

      logger.info(`[RAG] Collection created successfully`, { collectionName, vectorSize: this.vectorSize });
      console.log(`[RAG] Collection created: ${collectionName}`);
      endOperation(true, { created: true });
      return { success: true, created: true, existed: false };
    } catch (error) {
      logError('vectorStore', `Failed to create collection: ${collectionName}`, error);
      endOperation(false, { error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Adds documents to a specific collection
   * @param {string} collectionName - Name of the collection
   * @param {Array<Object>} documents - Array of documents with embeddings
   * @returns {Promise<Object>} - Success status and count
   */
  async addDocuments(collectionName, documents) {
    const endOperation = logOperation('vectorStore', 'addDocuments', {
      collectionName,
      documentCount: documents.length
    });

    try {
      // Ensure collection exists with correct vector size (with retry)
      const collectionResult = await this.createCollection(collectionName);
      if (!collectionResult.success) {
        throw new Error(`Failed to create collection: ${collectionResult.error}`);
      }

      // --- Dimension validation before insert ---
      for (let i = 0; i < documents.length; i++) {
        const doc = documents[i];
        if (!doc.embedding || !Array.isArray(doc.embedding)) {
          throw new Error(`Document at index ${i} has no embedding array`);
        }
        if (doc.embedding.length !== this.vectorSize) {
          throw new Error(
            `Vector dimension mismatch at document index ${i}: got ${doc.embedding.length}, expected ${this.vectorSize}. ` +
            `Ensure the same embedding model is used for indexing and searching.`
          );
        }
      }

      // Format documents for Qdrant - ensure we have valid UUIDs for IDs
      const points = documents.map(doc => {
        const originalId = doc.id;
        const qdrantId = this.generatePointId(originalId);

        return {
          id: qdrantId,
          vector: doc.embedding,
          payload: {
            original_id: originalId,
            content: doc.content,
            ...doc.metadata
          }
        };
      });

      // Add points in batches of 100 to prevent overwhelming the server
      const batchSize = 100;
      let totalAdded = 0;

      for (let i = 0; i < points.length; i += batchSize) {
        const batch = points.slice(i, i + batchSize);
        const batchNumber = Math.floor(i / batchSize) + 1;
        const totalBatches = Math.ceil(points.length / batchSize);

        logger.debug('Adding document batch', {
          collectionName,
          batchNumber,
          totalBatches,
          batchSize: batch.length
        });

        // Add batch with retry — surface the full error if it fails
        try {
          await retryWithBackoff(
            async () => await this.client.upsert(collectionName, {
              wait: true,
              points: batch
            }),
            { maxRetries: 3, baseDelay: 1000 },
            `Add batch ${batchNumber}/${totalBatches} to ${collectionName}`
          );
          totalAdded += batch.length;
          console.log(`[RAG] Inserted ${batch.length} vectors into collection '${collectionName}' (batch ${batchNumber}/${totalBatches}). Total so far: ${totalAdded}`);
        } catch (batchError) {
          // Surface the actual Qdrant error — do NOT swallow
          logger.error(`[RAG] Batch ${batchNumber}/${totalBatches} insertion FAILED for collection ${collectionName}`, {
            collectionName,
            batchNumber,
            batchSize: batch.length,
            error: batchError.message,
            stack: batchError.stack
          });
          console.error(`[RAG] INSERTION FAILED — batch ${batchNumber}/${totalBatches} in '${collectionName}': ${batchError.message}`);
          throw batchError; // Re-throw so the caller knows
        }
      }

      logger.info(`[RAG] Successfully inserted ${totalAdded} vectors into '${collectionName}'`, {
        collectionName,
        documentsAdded: totalAdded
      });
      console.log(`[RAG] Inserted ${totalAdded} vectors into collection '${collectionName}'`);

      endOperation(true, { documentsAdded: totalAdded });

      return {
        success: true,
        documentsAdded: totalAdded,
        collectionWasCreated: collectionResult.created,
        collectionAlreadyExisted: collectionResult.existed
      };
    } catch (error) {
      logger.error(`[RAG] addDocuments FAILED for collection '${collectionName}'`, {
        collectionName,
        error: error.message,
        stack: error.stack
      });
      console.error(`[RAG] addDocuments ERROR for '${collectionName}': ${error.message}`);
      endOperation(false, { error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Search for similar documents based on embedding
   * @param {string} collectionName - Target collection name
   * @param {Array<number>} queryEmbedding - Embedding to search for
   * @param {number} limit - Max results defaults to 5
   * @param {number} minScore - Minimum similarity score threshold
   * @param {number} timeoutMs - Max execution time in ms
   * @returns {Promise<Array<Object>>} - Retreived documents sorted by similarity
   */
  async search(collectionName, queryEmbedding, limit = 5, minScore = 0.7, timeoutMs = 30000) {
    const endOperation = logOperation('vectorStore', 'search', {
      collectionName,
      limit,
      minScore,
      timeoutMs
    });

    try {
      // --- Dimension validation before search ---
      if (!queryEmbedding || !Array.isArray(queryEmbedding)) {
        throw new Error('queryEmbedding must be a non-empty array');
      }
      if (queryEmbedding.length !== this.vectorSize) {
        throw new Error(
          `Search vector dimension mismatch: got ${queryEmbedding.length}, expected ${this.vectorSize}. ` +
          `Ensure the same embedding model is used for indexing and searching.`
        );
      }

      logger.debug('Starting search', {
        collectionName,
        limit,
        minScore,
        timeoutMs,
        queryDimension: queryEmbedding.length
      });

      // Ensure collection exists
      const collections = await this.client.getCollections();
      const exists = collections.collections.some(c => c.name === collectionName);

      if (!exists) {
        logger.warn(`[RAG] Collection '${collectionName}' does not exist — no vectors have been indexed yet.`, { collectionName });
        console.warn(`[RAG] Search skipped: collection '${collectionName}' not found. Index your materials first.`);
        endOperation(false, { reason: 'Collection not found' });
        return [];
      }

      // Create search promise with retry
      const searchWithRetry = async () => {
        return await retryWithBackoff(
          async () => await this.client.search(collectionName, {
            vector: queryEmbedding,
            limit: limit,
            score_threshold: minScore
          }),
          { maxRetries: 2, baseDelay: 1000 },
          `Search in ${collectionName}`
        );
      };

      // Search with timeout
      const searchResult = await retryWithTimeout(
        searchWithRetry,
        timeoutMs,
        {},
        `Search in ${collectionName}`
      );

      logger.info(`[RAG] Search completed in '${collectionName}'`, {
        collectionName,
        resultsFound: searchResult.length
      });
      console.log(`[RAG] Search in '${collectionName}' returned ${searchResult.length} results (minScore=${minScore})`);

      // Transform results to match our interface
      const results = searchResult.map(result => ({
        id: result.payload.original_id || result.id,
        content: result.payload.content,
        metadata: {
          ...result.payload,
          content: undefined // Remove content from metadata as it's already in the main field
        },
        score: result.score
      }));

      endOperation(true, { resultsFound: results.length });
      return results;
    } catch (error) {
      // Surface real errors clearly — do NOT silently swallow
      if (error.message && error.message.includes('timed out')) {
        logger.error('[RAG] Search timed out', { collectionName, timeoutMs, error: error.message });
        console.error(`[RAG] Search TIMEOUT in '${collectionName}' after ${timeoutMs}ms`);
      } else if (error.message && error.message.includes('dimension mismatch')) {
        logger.error('[RAG] CRITICAL: Vector dimension mismatch during search', { collectionName, error: error.message });
        console.error(`[RAG] CRITICAL dimension mismatch — ${error.message}`);
      } else {
        logError('vectorStore', `Search failed in ${collectionName}`, error);
        console.error(`[RAG] Search ERROR in '${collectionName}': ${error.message}`);
      }

      endOperation(false, { error: error.message });
      return [];
    }
  }

  /**
   * Get collection info
   * @param {string} collectionName - Name of the collection
   * @returns {Promise<Object>} - Collection info
   */
  async getCollection(collectionName) {
    try {
      return await this.client.getCollection(collectionName);
    } catch (error) {
      logError('vectorStore', `Failed to get collection: ${collectionName}`, error);
      return null;
    }
  }

  /**
   * Delete a collection
   * @param {string} collectionName - Name of the collection
   * @returns {Promise<boolean>} - Success status
   */
  async deleteCollection(collectionName) {
    const endOperation = logOperation('vectorStore', 'deleteCollection', { collectionName });

    try {
      await this.client.deleteCollection(collectionName);
      logger.info('Collection deleted', { collectionName });
      endOperation(true);
      return true;
    } catch (error) {
      logError('vectorStore', `Failed to delete collection: ${collectionName}`, error);
      endOperation(false, { error: error.message });
      return false;
    }
  }

  /**
   * List all collections for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array<string>>} - List of collection names
   */
  async listUserCollections(userId) {
    try {
      const collections = await this.client.getCollections();
      return collections.collections
        .filter(c => c.name.startsWith(`user_${userId}_`))
        .map(c => {
          const parts = c.name.split('_');
          const topicId = parts[parts.length - 1]; // Assume topicId is at the end
          return {
            collectionName: c.name,
            topicId,
            vectors_count: c.vectors_count // Will require a separate API call to get actual counts
          };
        });
    } catch (error) {
      logError('vectorStore', 'Failed to list user collections', error);
      return [];
    }
  }

  /**
   * Delete all indexed materials for a specific user and topic
   * @param {string} userId - User ID
   * @param {string} topicId - Topic ID
   * @returns {Promise<boolean>} - Success status
   */
  async deleteIndexedMaterials(userId, topicId) {
    const collectionName = `user_${userId}_topic_${topicId}`;
    return await this.deleteCollection(collectionName);
  }
}

// Ensure singleton instance
const vectorStore = new QdrantVectorStore();

module.exports = vectorStore;