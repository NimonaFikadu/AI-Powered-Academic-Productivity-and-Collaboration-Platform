
const https = require('https');
require('dotenv').config();

const apiKey = process.env.GEMINI_API_KEY;
const url = `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`;

https.get(url, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        if (res.statusCode === 200) {
            const models = JSON.parse(data);
            console.log('Available Models:');
            models.models.forEach(model => {
                if (model.supportedGenerationMethods && model.supportedGenerationMethods.includes('generateContent')) {
                    console.log(`- ${model.name} (Supports generateContent)`);
                } else {
                    console.log(`- ${model.name}`);
                }
            });
        } else {
            console.error(`Error: ${res.statusCode}`);
            console.error(data);
        }
    });

}).on("error", (err) => {
    console.error("Error: " + err.message);
});
