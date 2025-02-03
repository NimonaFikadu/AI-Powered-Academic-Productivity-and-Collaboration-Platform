// Use global fetch

async function testFetch() {
    const url = 'https://a9a702c7-c7fa-4b6e-add3-3db76dbd8764.us-east4-0.gcp.cloud.qdrant.io:6333/collections';
    console.log('Testing fetch to:', url);
    try {
        const response = await fetch(url);
        console.log('Status:', response.status);
        const text = await response.text();
        console.log('Body:', text);
    } catch (error) {
        console.error('Fetch error:', error);
    }
}

testFetch();
