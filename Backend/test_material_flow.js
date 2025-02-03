const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:5000/api';

async function testMaterialUpload() {
    try {
        const uniqueId = Math.random().toString(36).substring(7);
        const email = `matuser_${uniqueId}@example.com`;
        const password = 'Password123!';
        
        // 1. Setup User & Topic
        console.log('Setting up user and topic...');
        await axios.post(`${API_URL}/auth/signup`, { username: `MatUser_${uniqueId}`, email, password });
        const loginRes = await axios.post(`${API_URL}/auth/login`, { email, password });
        const token = loginRes.data.token;
        const headers = { Authorization: `Bearer ${token}` };
        
        const topicRes = await axios.post(`${API_URL}/topics`, { title: 'Material Test Topic' }, { headers });
        const topicId = topicRes.data.topicId;

        // 1.5 Upgrade User to Premium (directly in DB or via mock if possible)
        // Here we'll use a simple shell command since we can't easily hit a "mock upgrade" endpoint
        console.log('Upgrading user to premium...');
        const { execSync } = require('child_process');
        execSync(`node -e "const { User } = require('./src/models'); (async () => { await User.update({ subscription_status: 'premium' }, { where: { email: '${email}' } }); process.exit(0); })();"`, { cwd: __dirname });

        // 2. Upload Material
        console.log('Uploading material...');
        const form = new FormData();
        form.append('file', fs.createReadStream(path.join(__dirname, 'test.pdf')));
        form.append('topicId', topicId);

        const uploadStart = Date.now();
        const uploadRes = await axios.post(`${API_URL}/materials/upload`, form, {
            headers: {
                ...headers,
                ...form.getHeaders()
            }
        });
        const uploadTime = Date.now() - uploadStart;
        const materialId = uploadRes.data.material.id;
        console.log(`✅ Material uploaded in ${uploadTime}ms: ${materialId}`);

        // 3. Verify Parsing (Wait a bit for background indexing)
        console.log('Waiting for indexing...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        const progressRes = await axios.get(`${API_URL}/rag/index/${topicId}/progress`, { headers });
        console.log(`✅ Indexing status: ${progressRes.data.progress.status}`);
        
        // 4. Extract Text Check
        console.log('Extracting text for verification...');
        const extractRes = await axios.get(`${API_URL}/rag/extract/${materialId}`, { headers });
        console.log(`✅ Extracted text length: ${extractRes.data.text.length}`);
        // console.log(`Snippet: ${extractRes.data.text.substring(0, 100)}`);

    } catch (error) {
        console.error('❌ Material Upload Test Failed:', error.response ? error.response.data : error.message);
    }
}

testMaterialUpload();
