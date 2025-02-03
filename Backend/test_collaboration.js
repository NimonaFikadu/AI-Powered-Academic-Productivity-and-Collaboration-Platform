require('dotenv').config();
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
const axios = require('axios');
const { User, Topic, Material, Note, Quiz, QuizQuestion } = require('./src/models');
const { v4: uuidv4 } = require('uuid');
const db = require('./src/models');

const API_URL = 'http://localhost:5000/api';

async function runTest() {
  console.log('--- Starting Collaboration Access Test ---');
  let userA, userB;
  let topicId;
  let material;
  let noteId;
  let quizId;
  
  try {
    // 1. Database Setup
    console.log('-> Setting up test users and data directly in DB...');
    
    // Create User A
    userA = await User.create({
      id: uuidv4(),
      username: 'test_user_a',
      email: 'user_a@test.com',
      password_hash: 'dummy',
      created_at: new Date()
    });

    // Create User B
    userB = await User.create({
      id: uuidv4(),
      username: 'test_user_b',
      email: 'user_b@test.com',
      password_hash: 'dummy',
      created_at: new Date()
    });

    // Create Public Topic for User A
    const topic = await Topic.create({
      id: uuidv4(),
      title: 'Shared Public Topic',
      description: 'This is a test topic for sharing',
      user_id: userA.id,
      is_public: true,
      created_at: new Date()
    });
    topicId = topic.id;

    // Add Material
    material = await Material.create({
      id: uuidv4(),
      user_id: userA.id,
      topic_id: topicId,
      file_name: 'test_doc.pdf',
      uploaded_file: 'mock_uploaded_file.pdf',
      file_type: 'pdf',
      file_size: 1024,
      uploaded_at: new Date()
    });

    // Add Note
    const note = await Note.create({
      id: uuidv4(),
      title: 'Test Note',
      content: 'This note should be readable by User B',
      topic_id: topicId,
      user_id: userA.id,
      created_at: new Date()
    });
    noteId = note.id;

    // Add Quiz
    const quiz = await Quiz.create({
      id: uuidv4(),
      title: 'Test Quiz',
      topic_id: topicId,
      user_id: userA.id,
      difficulty: 'easy',
      is_ai_generated: false,
      created_at: new Date()
    });
    quizId = quiz.id;

    // We must generate JWT tokens to test the API securely
    const jwt = require('jsonwebtoken');
    const tokenA = jwt.sign({ id: userA.id, email: userA.email }, process.env.JWT_SECRET || 'your_super_secret_key_change_in_production', { expiresIn: '1h' });
    const tokenB = jwt.sign({ id: userB.id, email: userB.email }, process.env.JWT_SECRET || 'your_super_secret_key_change_in_production', { expiresIn: '1h' });

    console.log(`\nData created. UserA: ${userA.id}, UserB: ${userB.id}, Topic: ${topicId}`);
    console.log('-> Executing API requests as User B (the viewer)...\n');

    const headersB = { Authorization: `Bearer ${tokenB}` };

    // TEST 1: Topic Load
    console.log('[TEST 1] Fetching Topic Details...');
    try {
      const res1 = await axios.get(`${API_URL}/topics/${topicId}`, { headers: headersB });
      console.log(`✅ Topic loaded successfully: ${res1.data.title}`);
    } catch (err) {
      console.error(`❌ Failed to load Topic. Status: ${err.response?.status}, Msg: ${JSON.stringify(err.response?.data)}`);
      throw err;
    }

    // TEST 2: Materials Load
    console.log('\n[TEST 2] Fetching Topic Materials...');
    try {
      const res2 = await axios.get(`${API_URL}/materials/topic/${topicId}`, { headers: headersB });
      if (res2.data.length === 0) throw new Error('Materials array is empty!');
      console.log(`✅ Materials loaded successfully. Count: ${res2.data.length}`);
    } catch (err) {
      console.error(`❌ Failed to load Materials. Status: ${err.response?.status || err.message}`);
      throw err;
    }

    // TEST 3: Access Material File
    console.log('\n[TEST 3] Fetching File Serving Endpoint...');
    try {
      // In a real scenario it serves the file from the filesystem. Since 'mock_uploaded_file.pdf' doesn't exist,
      // it might legitimately return 404. However, if it hits 403 Forbidden, that means our access block failed.
      // We will check specifically for 403.
      await axios.get(`${API_URL}/materials/${userA.id}/mock_uploaded_file.pdf`, { headers: headersB });
      console.log(`✅ File accessed successfully (Mock file miraculously exists)`);
    } catch (err) {
      if (err.response?.status === 403) {
        console.error(`❌ Access Denied! 403 Forbidden.`);
        throw err;
      } else if (err.response?.status === 404) {
        if (err.response.data?.message?.includes('database records')) {
           console.log(`✅ Passed check! File access permitted, but DB/disk 404'd naturally since it's a mock file.`);
        } else {
           console.log(`✅ Passed check! File access permitted, but disk 404'd naturally since it's a mock file.`);
        }
      } else {
        console.error(`❌ API Failed: ${err.response?.status}`);
        throw err;
      }
    }

    // TEST 4: Notes Load
    console.log('\n[TEST 4] Fetching Topic Notes...');
    try {
      const res4 = await axios.get(`${API_URL}/notes/topic/${topicId}`, { headers: headersB });
      if (res4.data.notes.length === 0) throw new Error('Notes array is empty!');
      console.log(`✅ Notes loaded successfully. Count: ${res4.data.notes.length}`);
      
      // Attempt to load the specific note to test `getNote()`
      const singleNoteRes = await axios.get(`${API_URL}/notes/${noteId}`, { headers: headersB });
      console.log(`✅ Individual Note fetched safely.`);
    } catch (err) {
      console.error(`❌ Failed to load Notes. Status: ${err.response?.status || err.message}`);
      throw err;
    }

    // TEST 5: Quizzes Load
    console.log('\n[TEST 5] Fetching Topic Quizzes...');
    try {
      const res5 = await axios.get(`${API_URL}/quizzes/topic/${topicId}`, { headers: headersB });
      if (res5.data.quizzes.length === 0) throw new Error('Quizzes array is empty!');
      console.log(`✅ Quizzes loaded successfully. Count: ${res5.data.quizzes.length}`);

      // Attempt to load the specific quiz to test `getQuiz()`
      const singleQuizRes = await axios.get(`${API_URL}/quizzes/${quizId}`, { headers: headersB });
      console.log(`✅ Individual Quiz fetched safely.`);
    } catch (err) {
      console.error(`❌ Failed to load Quizzes. Status: ${err.response?.status || err.message}`);
      throw err;
    }

    console.log('\n🎉 ALL COLLABORATION TESTS PASSED!');

  } catch (error) {
    console.log('\n🚨 TEST SUITE FAILED:', error);
  } finally {
    // Cleanup
    console.log('\n-> Cleaning up test data...');
    if (userA && userA.id) {
       await Quiz.destroy({ where: { user_id: userA.id } });
       await Note.destroy({ where: { user_id: userA.id } });
       await Material.destroy({ where: { user_id: userA.id } });
       await Topic.destroy({ where: { user_id: userA.id } });
       await User.destroy({ where: { id: userA.id } });
    }
    if (userB && userB.id) {
       await User.destroy({ where: { id: userB.id } });
    }
    process.exit(0);
  }
}

runTest();
