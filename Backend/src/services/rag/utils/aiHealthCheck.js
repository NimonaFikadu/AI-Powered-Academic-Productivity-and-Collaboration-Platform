const { GoogleGenerativeAI } = require('@google/generative-ai');
const { Configuration, OpenAIApi } = require('openai');

const isValidKey = (key) => key && typeof key === 'string' && key.trim() !== '' && !key.includes('YOUR_API_KEY');

const QUOTA_TTL_MS = 60 * 1000; // 60 seconds

// Base internal memory cache
const memoryStats = {
    requests: 0,
    failures: 0,
    lastErrorType: null,
    providers: {
        gemini: { lockoutUntil: null },
        openrouter: { lockoutUntil: null }
    }
};

/**
 * Validates the existence and non-placeholder format of AI API keys at startup 

 * without crashing the server.
 */
const validateApiKeys = () => {
    console.log('\n[AI_INIT] Validating AI Configuration...');
    
    const geminiKey = process.env.GEMINI_API_KEY;
    if (isValidKey(geminiKey)) {
        console.log('[AI_INIT] Gemini key: OK');
    } else {
        console.warn('[AI_INIT] WARNING: GEMINI_API_KEY is missing or invalid. Primary AI features will fail over to OpenRouter.');
    }

    const openRouterKey = process.env.OPENAI_API_KEY;
    if (isValidKey(openRouterKey)) {
        console.log('[AI_INIT] OpenRouter key: OK');
    } else {
        console.warn('[AI_INIT] WARNING: OPENAI_API_KEY is missing or invalid. Fallback AI features will fail.');
    }
    console.log('');
};

/**
 * Helper to classify an error specifically for connectivity testing.
 */
const extractBasicErrorClass = (error) => {
    if (!error) return 'unknown';
    const msg = (error.message || '').toLowerCase();
    const status = error.response ? error.response.status : (error.status || 0);

    if (msg.includes('not configured')) return 'auth';
    if (status === 401 || status === 403 || msg.includes('api key') || msg.includes('auth')) return 'auth';
    if (status === 429 || msg.includes('rate limit') || msg.includes('quota')) return 'quota';
    if (msg.includes('network') || msg.includes('econn') || msg.includes('timeout') || msg.includes('fetch')) return 'network';
    
    return 'unknown';
};

/**
 * Lightweight function to test both AI providers for availability.
 */
const testAiConnectivity = async () => {
    const results = {
        gemini: 'down',
        openrouter: 'down',
        errorType: null
    };

    // Test Gemini — mirrors the production waterfall in geminiService.js
    // gemini-2.0-flash may 429; fall through to gemma-3-4b-it (confirmed quota-free)
    try {
        if (!isValidKey(process.env.GEMINI_API_KEY)) throw new Error('API key not configured');
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const HEALTH_MODELS = ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-flash-latest'];
        let geminiOk = false;
        for (const modelName of HEALTH_MODELS) {
            try {
                const model = genAI.getGenerativeModel({ model: modelName }, { apiVersion: 'v1beta' });
                await model.generateContent('Hello');
                console.log(`[AI_HEALTH] Gemini reachable via model: ${modelName}`);
                geminiOk = true;
                break;
            } catch (innerErr) {
                const s = innerErr.status || (innerErr.message && innerErr.message.match(/\[(\d{3})/)?.[1]) || 0;
                if (parseInt(s, 10) === 401 || parseInt(s, 10) === 403) break; // auth — no point continuing
            }
        }
        results.gemini = geminiOk ? 'up' : 'down';
        if (!geminiOk) results.errorType = 'quota';
    } catch (error) {
        results.gemini = 'down';
        results.errorType = extractBasicErrorClass(error);
    }

    // Test OpenRouter (OpenAI SDK approach)
    try {
        if (!isValidKey(process.env.OPENAI_API_KEY)) throw new Error('API key not configured');
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
        const openai = new OpenAIApi(configuration);
        
        // Minimal openrouter test — use llama-3.1-8b which is smaller and less congested
        await openai.createChatCompletion({
            model: 'meta-llama/llama-3.1-8b-instruct:free',
            messages: [{ role: 'user', content: 'Hello' }],
            max_tokens: 5
        });
        results.openrouter = 'up';
    } catch (error) {
        results.openrouter = 'down';
        // Only set errorType if gemini also failed, or overwrite with openrouter's error purely for diagnostic
        results.errorType = extractBasicErrorClass(error) !== 'unknown' ? extractBasicErrorClass(error) : results.errorType;
    }

    return results;
};

const recordSuccess = () => {
    memoryStats.requests += 1;
};

const recordFailure = (provider, errorClass) => {
    memoryStats.requests += 1;
    memoryStats.failures += 1;
    memoryStats.lastErrorType = errorClass;
    
    // Auth or Quota errors enforce a strict 60s cooldown limit
    if ((errorClass === 'quota' || errorClass === 'auth') && memoryStats.providers[provider]) {
        memoryStats.providers[provider].lockoutUntil = Date.now() + QUOTA_TTL_MS;
    }
};

const canUseProvider = (provider) => {
    const keyMissing = provider === 'gemini' 
        ? !isValidKey(process.env.GEMINI_API_KEY)
        : !isValidKey(process.env.OPENAI_API_KEY);
        
    if (keyMissing) return false;
    
    const lockout = memoryStats.providers[provider]?.lockoutUntil;
    if (lockout && Date.now() < lockout) {
        return false; // Still in cooldown
    }
    return true;
};

const getAiStats = () => {
    const rate = memoryStats.requests > 0 
        ? memoryStats.failures / memoryStats.requests 
        : 0;
        
    const successRate = 1 - rate;
    
    let status = 'HEALTHY';
    if (successRate < 0.5) status = 'DOWN';
    else if (successRate < 0.9) status = 'DEGRADED';
    
    if (memoryStats.requests === 0) status = 'HEALTHY';

    return {
        aiSuccessCount: memoryStats.requests - memoryStats.failures,
        aiFailureCount: memoryStats.failures,
        aiFailureRate: `${(rate * 100).toFixed(1)}%`,
        lastErrorType: memoryStats.lastErrorType || 'none',
        status
    };
};

const getProviderHealth = (provider) => {
    const keyMissing = provider === 'gemini' 
        ? !isValidKey(process.env.GEMINI_API_KEY)
        : !isValidKey(process.env.OPENAI_API_KEY);
        
    if (keyMissing) return 'down'; // no key = completely down
    
    const lockout = memoryStats.providers[provider]?.lockoutUntil;
    if (lockout && Date.now() < lockout) {
        return 'quota'; // blocked by quota locally
    }
    return 'ok';
};

module.exports = {
    isValidKey,
    validateApiKeys,
    testAiConnectivity,
    recordSuccess,
    recordFailure,
    canUseProvider,
    getAiStats,
    getProviderHealth
};
