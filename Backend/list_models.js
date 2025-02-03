const { GoogleGenerativeAI } = require('@google/generative-ai');

async function listModels() {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=AIzaSyBGc-C1RgTbuSj3ZB_x8WbYX_RI_0xtOGU`);
    const data = await response.json();
    console.log(JSON.stringify(data.models.map(m => m.name), null, 2));
  } catch (err) {
    console.error('Error:', err.message);
  }
}

listModels();
