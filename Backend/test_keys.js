const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGemini() {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'your_gemini_api_key_here');
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent('Hi');
    console.log('Gemini success:', await result.response.text());
  } catch (err) {
    console.error('Gemini error:', err.message);
  }
}

async function testOpenRouter() {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY || 'your_openrouter_api_key_here'}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.1-8b-instruct:free',
        messages: [{ role: 'user', content: 'Hi' }]
      })
    });
    const data = await response.json();
    console.log('OpenRouter response:', data);
  } catch (err) {
    console.error('OpenRouter error:', err.message);
  }
}

testGemini();
testOpenRouter();
