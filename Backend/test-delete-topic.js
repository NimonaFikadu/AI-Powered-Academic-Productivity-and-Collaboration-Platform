
require('dotenv').config();
const { Topic, User, Material, TopicProgress, sequelize } = require('./src/models');
const { v4: uuidv4 } = require('uuid');

async function testDeleteTopic() {
    try {
        console.log('1. Creating test user and topic...');
        // Mock user and topic creation for testing deletion logic
        // We'll just try to find an existing topic or create a dummy one if possible
        // But since we need a valid user ID, let's look for one

        const user = await User.findOne();
        if (!user) {
            console.log('No users found to test with.');
            return;
        }

        const topic = await Topic.create({
            title: 'Test Topic for Deletion',
            description: 'To be deleted',
            user_id: user.id
        });

        console.log(`Created topic: ${topic.id}`);

        // Add a progress record to simulate dependencies
        await TopicProgress.create({
            user_id: user.id,
            topic_id: topic.id,
            progress: 0,
            materials_count: 0
        });
        console.log('Created associated progress record');

        console.log('2. Attempting to delete topic...');
        await Topic.destroy({
            where: { id: topic.id }
        });

        console.log('✅ Topic deleted successfully (Cascade worked or manual cleanup needed)');

    } catch (error) {
        console.error('❌ Error deleting topic:', error);
        if (error.original) {
            console.error('Original DB Error:', error.original.message);
            console.error('SQL:', error.sql);
        }
    } finally {
        await sequelize.close();
    }
}

testDeleteTopic();
