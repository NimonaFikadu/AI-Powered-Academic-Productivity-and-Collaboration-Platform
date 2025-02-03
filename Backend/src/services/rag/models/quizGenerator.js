/**
 * Quiz Generator using RAG (Retrieval-Augmented Generation)
 * Generates educational quizzes based on retrieved context from materials
 */

const { Configuration, OpenAIApi } = require('openai');
const { v4: uuidv4 } = require('uuid');
const documentProcessor = require('../utils/documentProcessor');
const vectorStore = require('../utils/vectorStore');
const geminiService = require('../utils/geminiService');
const { createComponentLogger, logOperation, logError, logAiError } = require('../../../utils/logger');
const { retryWithBackoff, classifyError } = require('../../../utils/retryUtils');
const { canUseProvider, recordSuccess, recordFailure } = require('../utils/aiHealthCheck');

const logger = createComponentLogger('quizGenerator');

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
 * Generate a quiz for a topic using RAG
 * @param {Object} params - Quiz generation parameters
 * @param {string} params.title - Quiz title
 * @param {string} params.difficulty - Quiz difficulty (easy, medium, hard)
 * @param {number} params.numQuestions - Number of questions to generate
 * @param {string} params.userId - User ID
 * @param {string} params.topicId - Topic ID
 * @returns {Promise<Object>} - Generated quiz data
 */
const generateQuiz = async ({ title, difficulty, numQuestions, userId, topicId }) => {
  const endOperation = logOperation('quizGenerator', 'generateQuiz', {
    title,
    difficulty,
    numQuestions,
    userId,
    topicId
  });

  try {
    logger.info('Starting quiz generation', { title, difficulty, numQuestions, topicId });

    // Create a unique collection name
    const collectionName = `user_${userId}_topic_${topicId}`;

    // Generate embedding for the query
    const query = `Create a ${difficulty} quiz about ${title}`;
    const queryEmbedding = await documentProcessor.generateEmbedding(query);
    logger.debug('Query embedding generated', { queryLength: query.length });

    // Search for relevant documents
    const relevantDocs = await vectorStore.search(collectionName, queryEmbedding, 10, 0.4, 15000);
    logger.info('Retrieved relevant documents', {
      collectionName,
      documentsFound: relevantDocs.length
    });

    // Generate quiz content based on relevant documents
    let quizContent;

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

      context = selectedChunks.length > 0 ? selectedChunks.join('') : "No relevant materials found. Use your general pre-trained knowledge to generate the quiz about the topic.";
      
      const avgScore = selectedChunks.length > 0 ? (totalScore / selectedChunks.length).toFixed(4) : 0;
      console.log("[RAG] Selected chunks:", selectedChunks.length);
      console.log("[RAG] Avg score:", avgScore);
    } else {
      context = "No relevant materials found. Use your general pre-trained knowledge to generate the quiz about the topic.";
    }

    // Create prompt for quiz generation
    const prompt = `You are an expert quiz generator for educational purposes. Create a comprehensive quiz based on the provided context from learning materials.

For the quiz "${title}" with ${difficulty} difficulty, create ${numQuestions} multiple-choice questions using the following context:

${context}

Create a JSON array of quiz questions. Each question should have the following structure:
{
  "question": "Question text here",
  "questionType": "multiple_choice",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctAnswer": "Option B"
}

Rules:
1. All questions MUST be multiple choice with 4 options
2. Make sure the quiz is appropriately ${difficulty} difficulty level
3. Ensure questions test conceptual understanding and not just recall
4. Questions should be clear and unambiguous
5. IMPORTANT: You must ONLY return valid JSON array, nothing else before or after`;

    // Helper function to parse AI response into quiz content
    const parseQuizResponse = (aiResponse) => {
      // Sometimes the API returns the JSON with markdown code blocks, so we need to extract it
      const jsonMatch = aiResponse.match(/```json\n([\s\S]*?)\n```/) ||
        aiResponse.match(/```\n([\s\S]*?)\n```/) ||
        [null, aiResponse];

      const jsonString = jsonMatch[1] || aiResponse;
      const parsed = JSON.parse(jsonString);

      // Validate the quiz content structure
      if (!Array.isArray(parsed)) {
        throw new Error("Response is not a valid array");
      }

      // Ensure each question has the required properties
      return parsed.map((question, index) => {
        if (!question.question || !question.options || !question.correctAnswer) {
          throw new Error(`Question ${index + 1} is missing required properties`);
        }
        return {
          ...question,
          questionType: question.questionType || "multiple_choice",
          id: uuidv4()
        };
      });
    };

    // Try Gemini first (free tier, better rate limits)
    if (!canUseProvider('gemini')) {
      console.log(`[AI] Skipping Gemini (Rate limited or Unconfigured)`);
    } else {
      console.log(`[AI] Trying Gemini...`);
      try {
        const aiResponse = await retryWithBackoff(
          async () => {
            const response = await geminiService.generateContent(prompt);
            return response;
          },
          {
            maxRetries: 2,
            baseDelay: 1000,
            retryableErrors: ['rate limit', '503', '504', 'timeout']
          },
          'Gemini quiz generation'
        );

        quizContent = parseQuizResponse(aiResponse);
        console.log(`[LOG quiz_generator] ========= Successfully parsed ${quizContent.length} questions from Gemini`);
        recordSuccess();
        console.log(`[AI] Gemini success ✅`);
      } catch (error) {
        const errorType = classifyError(error);
        recordFailure('gemini', errorType);
        
        const status = error.response ? error.response.status : (error.status || 'unknown');
        
        logAiError({
          provider: 'gemini',
          userId,
          endpoint: '/rag/quiz',
          errorType,
          message: error.message
        });
        console.log(`[AI] Gemini failed`);
        console.log(`[AI] Gemini quota status: ${status}`);
      }
    }

    // Fallback to OpenRouter if Gemini failed
    if (!quizContent && !canUseProvider('openrouter')) {
      console.log(`[AI] Skipping OpenRouter (Rate limited or Unconfigured)`);
    } else if (!quizContent && canUseProvider('openrouter')) {
      console.log(`[AI] Trying OpenRouter...`);
      try {
        if (!process.env.OPENAI_API_KEY) throw new Error('API key not configured');
        if (!openai) throw new Error('OpenRouter client failed to initialize');
        
        let model = 'openai/gpt-4o-mini'; // Switched to highly reliable premium router model
        if (process.env.AI_MODE === 'cheap') model = 'google/gemma-2-9b-it:free';
        else if (process.env.AI_MODE === 'premium') model = 'openai/gpt-4o-mini';

        const completion = await retryWithBackoff(
          async () => {
            return await Promise.race([
              openai.createChatCompletion({
                model: model,
                messages: [
                  { role: 'system', content: 'You are an expert quiz generator. Return ONLY valid JSON array.' },
                  { role: 'user', content: prompt }
                ],
                temperature: 0.7,
                max_tokens: 4000
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
          'OpenRouter quiz generation'
        );

        const aiResponse = completion.data.choices[0].message.content;
        quizContent = parseQuizResponse(aiResponse);
        console.log(`[LOG quiz_generator] ========= Successfully parsed ${quizContent.length} questions from OpenRouter`);
        recordSuccess();
        console.log(`[AI] OpenRouter success ✅`);
      } catch (error) {
        const errorType = classifyError(error);
        recordFailure('openrouter', errorType);
        
        logAiError({
          provider: 'openrouter',
          userId,
          endpoint: '/rag/quiz',
          errorType,
          message: error.message
        });
        console.log(`[AI] OpenRouter failed`);
      }
    }

    // Both providers failed - Guaranteed final fallback response
    if (!quizContent) {
      logger.warn('All AI providers exhausted, using guaranteed fallback quiz', { userId, topicId });
      quizContent = [
        {
          id: uuidv4(),
          question: `Due to extreme service load, we could not generate customized questions about ${title} right now. Select "D" to continue studying your notes directly.`,
          questionType: "multiple_choice",
          options: ["Check back later", "Try again soon", "Network overloaded", "I will study my notes"],
          correctAnswer: "I will study my notes"
        }
      ];
    }

    // Create quiz data object
    const quizId = uuidv4();
    const quiz = {
      id: quizId,
      title,
      description: `AI-generated ${difficulty} quiz about ${title}`,
      difficulty,
      topic_id: topicId,
      user_id: userId,
      is_public: false,
      is_ai_generated: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log(`[LOG quiz_generator] ========= Quiz generation completed successfully`);
    return { quiz, questions: quizContent };
  } catch (error) {
    console.error('[LOG quiz_generator] ========= Error generating quiz:', error);
    throw new Error(`Failed to generate quiz: ${error.message}`);
  }
};

/**
 * Generates mock quiz content for development/testing
 * @param {string} title - Quiz title
 * @param {string} difficulty - Quiz difficulty
 * @param {number} numQuestions - Number of questions to generate
 * @returns {Array} - Generated quiz questions
 */
const generateMockQuiz = (title, difficulty, numQuestions) => {
  console.log('[LOG quiz_generator] ========= Generating mock quiz (OpenAI API key not available)');

  const mockQuestions = [];

  for (let i = 0; i < numQuestions; i++) {
    mockQuestions.push({
      id: uuidv4(),
      question: `Sample ${difficulty} question ${i + 1} about ${title}?`,
      questionType: "multiple_choice",
      options: [
        "Sample answer A",
        "Sample answer B",
        "Sample answer C",
        "Sample answer D"
      ],
      correctAnswer: "Sample answer B"
    });
  }

  return mockQuestions;
};

module.exports = {
  generateQuiz
}; 