/**
 * Test script to verify quiz generation with retry utilities
 */

// Set test environment variables
process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'test-key';

const quizGenerator = require('./src/services/rag/models/quizGenerator');

async function testQuizGeneration() {
    console.log('\n========== Testing Quiz Generator with Retry Utilities ==========\n');

    try {
        const params = {
            title: 'Test Quiz',
            difficulty: 'medium',
            numQuestions: 3,
            userId: 'test-user-123',
            topicId: 'test-topic-456'
        };

        console.log('Generating quiz with params:', params);

        const result = await quizGenerator.generateQuiz(params);

        console.log('\n✅ Quiz generation successful!');
        console.log('Quiz ID:', result.quiz.id);
        console.log('Quiz Title:', result.quiz.title);
        console.log('Number of questions:', result.questions.length);

        // Verify structure
        if (result.quiz && result.questions && Array.isArray(result.questions)) {
            console.log('\n✅ Quiz structure is valid');
            console.log('\nSample question:');
            console.log(JSON.stringify(result.questions[0], null, 2));
        } else {
            console.log('\n❌ Quiz structure is invalid');
        }

    } catch (error) {
        console.error('\n❌ Quiz generation failed:', error.message);
        console.error('Stack:', error.stack);
    }
}

// Run test
testQuizGeneration()
    .then(() => {
        console.log('\n========== Test Complete ==========\n');
        process.exit(0);
    })
    .catch((err) => {
        console.error('\n========== Test Failed ==========');
        console.error(err);
        process.exit(1);
    });
