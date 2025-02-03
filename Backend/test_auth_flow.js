
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const API_URL = 'http://localhost:5000/api';

async function testAuth() {
    const uniqueId = uuidv4().substring(0, 8);
    const email = `testuser_${uniqueId}@example.com`;
    const password = 'Password123!';
    const username = `User_${uniqueId}`;

    console.log(`Testing Auth with: ${email}`);

    try {
        // 1. Register
        console.log('1. Registering...');
        await axios.post(`${API_URL}/auth/signup`, {
            username,
            email,
            password
        });
        console.log('✅ Registration successful');

        // 2. Login
        console.log('2. Logging in...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email,
            password
        });

        const token = loginRes.data.token;
        if (!token) throw new Error('No token received');
        console.log('✅ Login successful, token received');

        // 3. Access Protected Route
        console.log('3. Accessing Protected Route (Statistics)...');
        const statsRes = await axios.get(`${API_URL}/topics`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('✅ Protected route accessed successfully during verification.');
        console.log('Stats:', statsRes.status);

    } catch (error) {
        console.error('❌ Auth Test Failed:', error.response ? error.response.data : error.message);
    }
}

testAuth();
