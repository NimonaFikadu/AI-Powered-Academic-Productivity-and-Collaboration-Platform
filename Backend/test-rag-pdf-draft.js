
require('dotenv').config();
const documentProcessor = require('./src/services/rag/utils/documentProcessor');
const path = require('path');
const fs = require('fs');

async function testPdfProcessing() {
    try {
        console.log('1. Creating dummy PDF...');
        const testPdfPath = path.join(__dirname, 'test.pdf');
        // We can't easily create a real PDF without a library, so we'll test the extraction logic
        // with a mock approach OR we just test if the documentProcessor handles errors gracefully.

        // Better: Let's test extractTextFromFile directly if we can't create a PDF.
        // But wait, we can try to find an existing PDF or just trust the logic if we inspect it?
        // Let's create a dummy text file pretending to be a PDF to see if it fails "correctly" or if we can make a text file.

        fs.writeFileSync(testPdfPath, 'Dummy PDF content');
        // This will likely fail PDF parsing, but let's see HOW it fails. 
        // Real parsing needs a valid PDF header.

        console.log('2. Testing extraction...');
        try {
            // We expect this to fail if it's not a real PDF
            const text = await documentProcessor.extractTextFromFile(testPdfPath, 'pdf');
            console.log('Extracted:', text);
        } catch (e) {
            console.log('Expected error (since not real PDF):', e.message);
        }

        // Let's test with a text file which IS supported normally or at least easy to mock?
        // documentProcessor.js supports 'pdf', 'docx', 'image', 'ppt'. 
        // It doesn't seem to support 'txt' explicitly in the switch case I saw earlier! 
        // Wait, let me check documentProcessor.js again.

    } catch (e) {
        console.error(e);
    }
}
testPdfProcessing();
