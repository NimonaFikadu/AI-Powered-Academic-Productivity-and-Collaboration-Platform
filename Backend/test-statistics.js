const fetch = require('node-fetch');

// Test configuration
const API_BASE_URL = 'http://localhost:3000/api';
const TEST_USER_TOKEN = 'your-test-token-here'; // Replace with actual token

async function testStatisticsEndpoints() {
  console.log('[LOG test] ========= Testing Statistics Endpoints');
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${TEST_USER_TOKEN}`
  };
  
  try {
    // Test 1: Get comprehensive statistics
    console.log('\n1. Testing GET /statistics (comprehensive)');
    const statsResponse = await fetch(`${API_BASE_URL}/statistics`, {
      method: 'GET',
      headers
    });
    
    if (statsResponse.ok) {
      const statsData = await statsResponse.json();
      console.log('✅ Comprehensive statistics fetched successfully');
      console.log('Topics progress count:', statsData.topics_progress?.length || 0);
      console.log('Quiz progress count:', statsData.quiz_progress?.length || 0);
      console.log('Note progress count:', statsData.note_progress?.length || 0);
      console.log('Study sessions count:', statsData.study_hours?.length || 0);
      console.log('Summary:', statsData.summary);
    } else {
      console.log('❌ Failed to fetch comprehensive statistics:', statsResponse.status);
    }
    
    // Test 2: Get quiz performance only
    console.log('\n2. Testing GET /statistics/quiz-performance');
    const quizResponse = await fetch(`${API_BASE_URL}/statistics/quiz-performance`, {
      method: 'GET',
      headers
    });
    
    if (quizResponse.ok) {
      const quizData = await quizResponse.json();
      console.log('✅ Quiz performance fetched successfully');
      console.log('Quiz progress count:', quizData.quiz_progress?.length || 0);
      console.log('Quiz summary:', quizData.summary);
    } else {
      console.log('❌ Failed to fetch quiz performance:', quizResponse.status);
    }
    
    // Test 3: Get note progress only
    console.log('\n3. Testing GET /statistics/note-progress');
    const noteResponse = await fetch(`${API_BASE_URL}/statistics/note-progress`, {
      method: 'GET',
      headers
    });
    
    if (noteResponse.ok) {
      const noteData = await noteResponse.json();
      console.log('✅ Note progress fetched successfully');
      console.log('Note progress count:', noteData.note_progress?.length || 0);
      console.log('Note summary:', noteData.summary);
    } else {
      console.log('❌ Failed to fetch note progress:', noteResponse.status);
    }
    
    // Test 4: Get all study sessions (no date filter)
    console.log('\n4. Testing GET /statistics/study-sessions (all-time)');
    const studyAllResponse = await fetch(`${API_BASE_URL}/statistics/study-sessions`, {
      method: 'GET',
      headers
    });
    
    if (studyAllResponse.ok) {
      const studyAllData = await studyAllResponse.json();
      console.log('✅ All-time study sessions fetched successfully');
      console.log('Study sessions count:', studyAllData.study_hours?.length || 0);
      console.log('Study summary:', studyAllData.summary);
    } else {
      console.log('❌ Failed to fetch all-time study sessions:', studyAllResponse.status);
    }
    
    // Test 5: Get study sessions with date filter (last 7 days)
    console.log('\n5. Testing GET /statistics/study-sessions?days=7');
    const study7Response = await fetch(`${API_BASE_URL}/statistics/study-sessions?days=7`, {
      method: 'GET',
      headers
    });
    
    if (study7Response.ok) {
      const study7Data = await study7Response.json();
      console.log('✅ Last 7 days study sessions fetched successfully');
      console.log('Study sessions count (last 7 days):', study7Data.study_hours?.length || 0);
      console.log('Study summary (last 7 days):', study7Data.summary);
    } else {
      console.log('❌ Failed to fetch last 7 days study sessions:', study7Response.status);
    }
    
  } catch (error) {
    console.error('[LOG test] ========= Error testing statistics endpoints:', error);
  }
}

// Instructions for running the test
console.log(`
To run this test:
1. Make sure your backend server is running on localhost:3000
2. Replace TEST_USER_TOKEN with a valid JWT token
3. Run: node test-statistics.js

To get a test token:
1. Login via POST /api/auth/login
2. Copy the token from the response
3. Replace TEST_USER_TOKEN above
`);

// Uncomment the line below to run the test
// testStatisticsEndpoints();

module.exports = { testStatisticsEndpoints }; 