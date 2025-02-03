const axios = require('axios');
const API_URL = 'http://localhost:5000/api';

async function testTopicCRUD() {
    try {
        const uniqueId = Math.random().toString(36).substring(7);
        const email = `topicuser_${uniqueId}@example.com`;
        const password = 'Password123!';
        const username = `TopicUser_${uniqueId}`;

        // 0. Register
        console.log(`Registering ${email}...`);
        await axios.post(`${API_URL}/auth/signup`, {
            username, email, password
        });

        // 1. Login to get token
        console.log('Logging in...');
        const authRes = await axios.post(`${API_URL}/auth/login`, {
            email,
            password
        });
        const token = authRes.data.token;
        const headers = { Authorization: `Bearer ${token}` };

        // 2. Create Private Topic
        console.log('Creating private topic...');
        const privateStart = Date.now();
        const createRes = await axios.post(`${API_URL}/topics`, {
            title: 'Audit Private Topic',
            description: 'Testing private visibility',
            isPublic: false
        }, { headers });
        const privateTime = Date.now() - privateStart;
        const topicId = createRes.data.topicId;
        console.log(`✅ Private Topic created in ${privateTime}ms: ${topicId}`);

        // 3. Toggle to Public
        console.log('Toggling to public...');
        const toggleStart = Date.now();
        await axios.put(`${API_URL}/topics/${topicId}`, {
            isPublic: true
        }, { headers });
        const toggleTime = Date.now() - toggleStart;
        console.log(`✅ Topic toggled to public in ${toggleTime}ms`);

        // 4. Verify Public Access
        console.log('Verifying public access...');
        const verifyRes = await axios.get(`${API_URL}/topics/${topicId}`, { headers });
        console.log(`✅ Topic fetch status: ${verifyRes.status}, isPublic: ${verifyRes.data.is_public}`);

        // Clean up
        // await axios.delete(`${API_URL}/topics/${topicId}`, { headers });

    } catch (error) {
        console.error('❌ Topic CRUD Test Failed:', error.response ? error.response.data : error.message);
    }
}

testTopicCRUD();
