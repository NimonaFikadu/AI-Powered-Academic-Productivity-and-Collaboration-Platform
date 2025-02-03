
require('dotenv').config();
const vectorStore = require('./src/services/rag/utils/vectorStore');
const { User, Topic, Material } = require('./src/models');
const path = require('path');
const fs = require('fs');

async function inspectCollections() {
    try {
        console.log('1. Finding User & Topic...');
        const users = await User.findAll();
        // Assuming we want the user who owns 'sample'
        const topics = await Topic.findAll();
        const targetTopic = topics.find(t => t.title.toLowerCase() === 'sample');

        if (!targetTopic) {
            console.log('Topic "sample" not found.');
            return;
        }

        const user = users.find(u => u.id === targetTopic.user_id);
        console.log(`Topic: "${targetTopic.title}" (ID: ${targetTopic.id})`);
        console.log(`Owner: ${user ? user.username : 'Unknown'} (ID: ${targetTopic.user_id})`);

        console.log('\n2. Checking Materials in DB...');
        const materials = await Material.findAll({ where: { topic_id: targetTopic.id } });
        console.log(`Found ${materials.length} materials assigned to this topic.`);

        materials.forEach(m => {
            console.log(`- Material: ${m.file_name}`);
            console.log(`  ID: ${m.id}`);
            console.log(`  Uploaded File: ${m.uploaded_file}`);

            // Check file existence
            const filePath = path.join(__dirname, 'uploads/materials', m.uploaded_file);
            // Note: Backend root is where this script runs, but code uses relative paths.
            // Let's check logic:
            // This script runs in Backend/
            // App uses: path.join(__dirname (models), '../../../../uploads/materials') -> Backend/uploads/materials
            // So we check path.join(__dirname, 'uploads/materials')

            if (fs.existsSync(filePath)) {
                console.log(`  ✅ File exists at: ${filePath}`);
            } else {
                console.log(`  ❌ File MISSING at: ${filePath}`);
            }
        });

        console.log('\n3. Checking Collection Status...');
        const collectionName = `user_${targetTopic.user_id}_topic_${targetTopic.id}`;
        console.log(`Collection Name: ${collectionName}`);

        try {
            const collection = await vectorStore.client.getCollection(collectionName);
            console.log('✅ Collection FOUND!');
            // console.log('Full Collection Object:', JSON.stringify(collection, null, 2));
            // According to Qdrant docs, getCollection return type has 'points_count' or 'vectors_count'
            console.log(`- Points Count: ${collection.points_count}`);
            console.log(`- Vectors Count: ${collection.vectors_count}`);
            console.log(`- Status: ${collection.status}`);

            if (collection.points_count > 0) {
                const search = await vectorStore.client.scroll(collectionName, { limit: 1, with_payload: true });
                if (search.points.length > 0) {
                    console.log(`\nSample Point Payload:`);
                    console.log(JSON.stringify(search.points[0].payload, null, 2));
                }
            }

        } catch (e) {
            console.log('❌ Collection NOT FOUND (or error fetching):', e.message);
            if (e.status === 404) console.log('  (404 Not Found confirms indexing failed)');
        }

    } catch (e) {
        console.error('Error:', e);
    }
}
inspectCollections();
