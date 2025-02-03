const axios = require('axios');
require('dotenv').config();

async function deepProbe() {
    console.log('--- Deep Diagnostic Probe ---');

    // 1. Qdrant Probe
    console.log('\n[1] Qdrant Cloud Probe...');
    try {
        const qUrl = process.env.QDRANT_URL;
        const qKey = process.env.QDRANT_API_KEY;
        
        const healthRes = await axios.get(`${qUrl}/collections`, {
            headers: { 'api-key': qKey },
            timeout: 5000
        });
        console.log('✅ Qdrant Connection:', healthRes.status, 'Collections:', (healthRes.data.result.collections || []).length);
    } catch (e) {
        console.error('❌ Qdrant FAILED:', e.message);
        if (e.response) console.error('Response:', e.response.status, e.response.data);
    }

    // 2. Gemini Probe
    console.log('\n[2] Gemini API Probe...');
    try {
        const gKey = process.env.GEMINI_API_KEY;
        const gRes = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${gKey}`, {
            contents: [{ parts: [{ text: 'Please respond with "OK"' }] }]
        }, { timeout: 10000 });
        console.log('✅ Gemini Response:', gRes.data?.candidates?.[0]?.content?.parts?.[0]?.text);
    } catch (e) {
        console.error('❌ Gemini FAILED:', e.message);
        if (e.response) console.error('Response:', e.response.status, e.response.data);
    }

    // 3. OpenRouter Probe
    console.log('\n[3] OpenRouter Probe...');
    try {
        const orKey = process.env.OPENAI_API_KEY;
        const orRes = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
            model: 'google/gemma-2-9b-it:free',
            messages: [{ role: 'user', content: 'Ping' }],
            max_tokens: 5
        }, {
            headers: { 'Authorization': `Bearer ${orKey}`, 'HTTP-Referer': 'http://localhost' },
            timeout: 10000
        });
        console.log('✅ OpenRouter Response:', orRes.data?.choices?.[0]?.message?.content);
    } catch (e) {
        console.error('❌ OpenRouter FAILED:', e.message);
        if (e.response) console.error('Response:', e.response.status, e.response.data);
    }
}

deepProbe();
