const axios = require('axios');
const API_URL = 'http://localhost:5000/api';

async function traceRagPipeline() {
    try {
        console.log('--- RAG Pipeline Deep Trace ---');
        
        // 1. Setup
        const uniqueId = Math.random().toString(36).substring(7);
        const email = `traceuser_${uniqueId}@example.com`;
        const password = 'Password123!';
        const username = `TraceUser_${uniqueId}`;

        await axios.post(`${API_URL}/auth/signup`, { username, email, password });
        const authRes = await axios.post(`${API_URL}/auth/login`, { email, password });
        const token = authRes.data.token;
        const headers = { Authorization: `Bearer ${token}` };

        // Upgrade to premium
        const { execSync } = require('child_process');
        execSync(`node -e "const { User } = require('./src/models'); (async () => { await User.update({ subscription_status: 'premium' }, { where: { email: '${email}' } }); process.exit(0); })();"`, { cwd: __dirname });

        const topicRes = await axios.post(`${API_URL}/topics`, { title: 'RAG Trace Topic' }, { headers });
        const topicId = topicRes.data.topicId;

        // 1.7 Upload Material for indexing
        console.log('[STEP] Uploading Material...');
        const FormData = require('form-data');
        const fs = require('fs');
        const path = require('path');
        const form = new FormData();
        form.append('file', fs.createReadStream(path.join(__dirname, 'test.pdf')));
        form.append('topicId', topicId);
        await axios.post(`${API_URL}/materials/upload`, form, {
            headers: { ...headers, ...form.getHeaders() }
        });
        
        console.log('[STEP] Waiting for indexing (10s)...');
        await new Promise(resolve => setTimeout(resolve, 10000));

        // 2. Perform RAG Generation (Note)
        console.log('[STEP] Requesting Note Generation...');
        const start = Date.now();
        const noteRes = await axios.post(`${API_URL}/rag/notes`, {
            title: 'Audit Summary',
            userGoal: 'Summarize the current system audit status',
            topicId: topicId
        }, { headers });
        const totalTime = Date.now() - start;

        console.log(`[PROOF] Status: ✅`);
        console.log(`[PROOF] Response Time: ${totalTime}ms`);
        console.log(`[PROOF] Result: ${noteRes.data.note.content.substring(0, 50)}...`);

        // Note: The deep logging steps [STEP 1-6] will be extracted from the server logs 
        // because the controller doesn't return them in the response.

    } catch (error) {
        console.error('[PROOF] Status: ❌');
        console.error('[PROOF] Error:', error.response ? error.response.data : error.message);
    }
}

traceRagPipeline();
