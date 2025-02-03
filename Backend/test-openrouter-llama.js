require('dotenv').config();
const { Configuration, OpenAIApi } = require('openai');

async function test() {
  try {
    const key = process.env.OPENAI_API_KEY || 'your_openrouter_api_key_here';
    
    const configuration = new Configuration({
      apiKey: key,
      basePath: 'https://openrouter.ai/api/v1',
      baseOptions: {
        headers: {
          "HTTP-Referer": "http://localhost:3000",
          "X-Title": "UniHub",
        }
      }
    });

    const openai = new OpenAIApi(configuration);
    
    console.log('[Connecting to OpenRouter...]');
    
    const completion = await openai.createChatCompletion({
      model: 'openrouter/free',
      messages: [{ role: 'user', content: 'Say hello' }]
    });

    console.log('[Success]', completion.data.choices[0].message.content);

  } catch (error) {
    if (error.response) {
      console.log('Error Data:', error.response.data);
      console.log('Error Status:', error.response.status);
    } else {
      console.log('Error Message:', error.message);
    }
  }
}

test();
