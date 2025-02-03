
const { v4: uuidv4 } = require('uuid');

const API_URL = 'http://localhost:8081/api';

async function testAuth() {
    const uniqueId = uuidv4().substring(0, 8);
    // Use a unique email every time
    const email = `test_auth_${Date.now()}@example.com`;
    const password = 'Password123!';
    const username = `User_${uniqueId}`;

    console.log(`Testing Auth with: ${email}`);

    try {
        // 1. Register
        console.log('1. Registering...');
        const regRes = await fetch(`${API_URL}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });

        if (!regRes.ok) {
            const errText = await regRes.text();
            throw new Error(`Register failed: ${regRes.status} ${regRes.statusText} - ${errText}`);
        }
        console.log('✅ Registration successful');

        // 2. Login
        console.log('2. Logging in...');
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        if (!loginRes.ok) {
            const errText = await loginRes.text();
            throw new Error(`Login failed: ${loginRes.status} ${loginRes.statusText} - ${errText}`);
        }

        const loginData = await loginRes.json();
        const token = loginData.token;
        if (!token) throw new Error('No token received');
        console.log('✅ Login successful, token received');

        // 3. Access Protected Route
        console.log('3. Accessing Protected Route (Statistics)...');
        const statsRes = await fetch(`${API_URL}/statistics`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!statsRes.ok) {
            const errText = await statsRes.text();
            throw new Error(`Protected route failed: ${statsRes.status} ${statsRes.statusText} - ${errText}`);
        }

        console.log('✅ Protected route accessed successfully during verification.');

    } catch (error) {
        console.error('❌ Auth Test Failed:', error.message);
    }
}

testAuth();
