const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGemini() {
  try {
    const genAI = new GoogleGenerativeAI('AIzaSyBGc-C1RgTbuSj3ZB_x8WbYX_RI_0xtOGU');
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent('Hi');
    console.log('Gemini 2.5 flash success:', await result.response.text());
  } catch (err) {
    console.error('Gemini 2.5 error:', err.message);
  }

  try {
    const genAI = new GoogleGenerativeAI('AIzaSyBGc-C1RgTbuSj3ZB_x8WbYX_RI_0xtOGU');
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent('Hi');
    console.log('Gemini 2.0 flash success:', await result.response.text());
  } catch (err) {
    console.error('Gemini 2.0 error:', err.message);
  }
}

testGemini();
