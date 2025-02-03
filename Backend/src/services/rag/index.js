/**
 * RAG (Retrieval-Augmented Generation) Service
 * Main entry point for the RAG functionality
 */

const noteGenerator = require('./models/noteGenerator');
const quizGenerator = require('./models/quizGenerator');
const documentProcessor = require('./utils/documentProcessor');
const vectorStore = require('./utils/vectorStore');

/**
 * Generate an educational note using RAG
 * @param {Object} params - Note generation parameters
 * @returns {Promise<Object>} - Generated note
 */
const generateNote = async (params) => {
  return await noteGenerator.generateNote(params);
};

/**
 * Generate an educational quiz using RAG
 * @param {Object} params - Quiz generation parameters
 * @returns {Promise<Object>} - Generated quiz with questions
 */
const generateQuiz = async (params) => {
  return await quizGenerator.generateQuiz(params);
};

/**
 * Index learning materials for a user and topic
 * @param {Array} materials - Materials to index
 * @param {string} userId - User ID
 * @param {string} topicId - Topic ID
 * @returns {Promise<string>} - Collection name
 */
const indexMaterials = async (materials, userId, topicId) => {
  return await noteGenerator.indexMaterials(materials, userId, topicId);
};

/**
 * Search through indexed materials
 * @param {string} query - Search query
 * @param {string} userId - User ID
 * @param {string} topicId - Topic ID
 * @param {number} limit - Maximum number of results
 * @returns {Promise<Array>} - Search results
 */
const searchMaterials = async (query, userId, topicId, limit = 5) => {
  try {
    const collectionName = `user_${userId}_topic_${topicId}`;
    
    // Generate embedding for the query
    const queryEmbedding = await documentProcessor.generateEmbedding(query);
    
    // Search for relevant documents
    const results = await vectorStore.search(collectionName, queryEmbedding, limit, 0.6);
    
    return results;
  } catch (error) {
    console.error(`[LOG rag_service] ========= Error searching materials:`, error);
    throw error;
  }
};

/**
 * Delete a collection of indexed materials
 * @param {string} userId - User ID
 * @param {string} topicId - Topic ID
 * @returns {Promise<boolean>} - Success status
 */
const deleteIndexedMaterials = async (userId, topicId) => {
  try {
    const collectionName = `user_${userId}_topic_${topicId}`;
    return await vectorStore.deleteCollection(collectionName);
  } catch (error) {
    console.error(`[LOG rag_service] ========= Error deleting indexed materials:`, error);
    return false;
  }
};

/**
 * List all collections for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} - List of collections
 */
const listUserCollections = async (userId) => {
  try {
    const collections = await vectorStore.client.getCollections();
    return collections.collections
      .filter(collection => collection.name.startsWith(`user_${userId}`))
      .map(collection => ({
        name: collection.name,
        topicId: collection.name.split('_').pop(),
        vectors_count: collection.vectors_count
      }));
  } catch (error) {
    console.error(`[LOG rag_service] ========= Error listing user collections:`, error);
    return [];
  }
};

/**
 * Process and extract text from a material file
 * @param {string} filePath - Path to the file
 * @param {string} fileType - Type of the file
 * @returns {Promise<string>} - Extracted text
 */
const extractTextFromMaterial = async (filePath, fileType) => {
  try {
    return await documentProcessor.extractTextFromFile(filePath, fileType);
  } catch (error) {
    console.error(`[LOG rag_service] ========= Error extracting text from material:`, error);
    throw error;
  }
};

/**
 * Handles a chat conversation with context from materials in a topic
 * @param {string} message - User message
 * @param {string} userId - User ID
 * @param {string|null} topicId - Topic ID (optional)
 * @param {Array} previousMessages - Previous messages in the conversation
 * @returns {Promise<string>} - Assistant response
 */
const chatWithTopic = async (message, userId, topicId = null, previousMessages = []) => {
  return await noteGenerator.chatWithTopic({
    message,
    userId,
    topicId,
    previousMessages
  });
};

module.exports = {
  generateNote,
  generateQuiz,
  indexMaterials,
  searchMaterials,
  deleteIndexedMaterials,
  listUserCollections,
  extractTextFromMaterial,
  chatWithTopic
}; 