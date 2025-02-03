/**
 * Gemini AI Service Utility
 * Provides methods for generating embeddings and completions using Google Gemini
 *
 * Model waterfall (tried in order until one succeeds):
 *   1. gemini-2.0-flash       – fastest/best quality (may 429 if quota exhausted)
 *   2. gemini-2.0-flash-lite  – lower quota tier, separate limit
 *   3. gemma-3-4b-it          – Google open model, confirmed quota-free on free tier
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini if API key is available
let genAI = null;
if (process.env.GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

/**
 * Ordered list of generation models to try (best → most available).
 * gemma-3-4b-it confirmed working even when flash quota is exhausted.
 */
const GENERATION_MODELS = [
    'gemini-2.5-flash',
    'gemini-2.5-pro',
    'gemini-flash-latest',
];

/**
 * Generates an embedding for text using Gemini's embedding-001 model
 * @param {string} text - Text to embed
 * @returns {Promise<Array<number>>} - Embedding vector (768 dimensions)
 */
const generateEmbedding = async (text) => {
    if (!genAI) {
        throw new Error('Gemini API key not configured');
    }

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-embedding-001' }, { apiVersion: 'v1beta' });
        const result = await model.embedContent(text);
        return result.embedding.values;
    } catch (error) {
        console.error('[LOG gemini_service] ========= Error generating embedding:', error);
        throw error;
    }
};

/**
 * Generates content using a Gemini model waterfall.
 * Tries each model in GENERATION_MODELS order; skips on 429/quota and
 * moves to the next. Throws only when all models are exhausted.
 *
 * @param {string} prompt - Prompt for the model
 * @param {Object} options - Generation options (unused, kept for API compat)
 * @returns {Promise<string>} - Generated text
 */
const generateContent = async (prompt, options = {}) => {
    if (!genAI) {
        throw new Error('Gemini API key not configured');
    }

    let lastError;

    for (const modelName of GENERATION_MODELS) {
        try {
            console.log(`[AI] Gemini attempting model: ${modelName}`);
            const model = genAI.getGenerativeModel({ model: modelName }, { apiVersion: 'v1beta' });
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            console.log(`[AI] Gemini model success: ${modelName}`);
            return text;
        } catch (error) {
            lastError = error;
            const status = error.status || (error.message && error.message.match(/\[(\d{3})/)?.[1]) || 'unknown';
            console.warn(`[AI] Gemini model ${modelName} failed (${status}): ${error.message && error.message.substring(0, 80)}`);

            // Only continue waterfall for quota/rate-limit errors (429) or not-found (404).
            // Auth errors (401/403) are unrecoverable — break immediately.
            const numStatus = parseInt(status, 10);
            if (numStatus === 401 || numStatus === 403) {
                console.error('[AI] Gemini auth error — stopping waterfall');
                break;
            }
            // 429 or 404 → try next model
            console.log(`[AI] Gemini falling back to next model...`);
        }
    }

    console.error('[AI] Gemini all models exhausted');
    throw lastError || new Error('All Gemini models failed');
};

module.exports = {
    generateEmbedding,
    generateContent,
    GENERATION_MODELS,
};
