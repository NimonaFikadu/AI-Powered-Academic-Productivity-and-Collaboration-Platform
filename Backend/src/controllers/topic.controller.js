const { Topic, TopicProgress, User } = require('../models');
const db = require('../models');
const path = require('path');
const fs = require('fs');
const { Op } = require('sequelize');

const getTopics = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    const { count, rows: topics } = await Topic.findAndCountAll({
      where: {
        user_id: req.user.id
      },
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['username']
        }
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset,
      distinct: true
    });

    const formattedTopics = topics.map(topic => {
      const plainTopic = topic.get({ plain: true });
      return {
        ...plainTopic,
        creator_name: plainTopic.creator ? plainTopic.creator.username : 'Unknown'
      };
    });

    console.log(`[LOG getTopics] ========= Found ${formattedTopics.length} topics`);

    res.json({
      topics: formattedTopics,
      pagination: {
        total: count,
        page,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('[LOG getTopics ERROR] =========', error);
    res.status(500).json({ message: 'Error fetching topics' });
  }
};

const getTopic = async (req, res) => {
  try {
    const topic = await Topic.findOne({
      where: {
        id: req.params.id,
        [Op.or]: [
          { user_id: req.user.id },
          { is_public: true }
        ]
      },
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['username']
        }
      ]
    });

    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }

    console.log("[ACCESS]", {
      topicId: req.params.id,
      requester: req.user.id,
      owner: topic.user_id,
      isPublic: topic.is_public
    });

    const plainTopic = topic.get({ plain: true });
    res.json({
      ...plainTopic,
      creator_name: plainTopic.creator ? plainTopic.creator.username : 'Unknown'
    });
  } catch (error) {
    console.error('Error fetching topic:', error);
    res.status(500).json({ message: 'Error fetching topic' });
  }
};

const createTopic = async (req, res) => {
  const { title, description, isPublic = false } = req.body;

  try {
    const topic = await Topic.create({
      title,
      description,
      user_id: req.user.id,
      is_public: isPublic
    });

    // Create initial progress record
    await TopicProgress.create({
      user_id: req.user.id,
      topic_id: topic.id,
      progress: 0,
      materials_count: 0,
      last_activity: new Date()
    });

    res.status(201).json({
      message: 'Topic created successfully',
      topicId: topic.id
    });
  } catch (error) {
    console.error('[LOG topic] ========= Error creating topic:', error);
    res.status(500).json({ message: 'Error creating topic' });
  }
};

const updateTopic = async (req, res) => {
  const { title, description, isPublic } = req.body;

  try {
    const topic = await Topic.findOne({
      where: { id: req.params.id, user_id: req.user.id }
    });

    if (!topic) {
      return res.status(404).json({
        message: 'Topic not found or you do not have permission to update it'
      });
    }

    await topic.update({
      title: title !== undefined ? title : topic.title,
      description: description !== undefined ? description : topic.description,
      is_public: isPublic !== undefined ? isPublic : topic.is_public
    });

    res.json({ message: 'Topic updated successfully' });
  } catch (error) {
    console.error('Error updating topic:', error);
    res.status(500).json({ message: 'Error updating topic' });
  }
};

const deleteTopic = async (req, res) => {
  const transaction = await db.sequelize.transaction();

  try {
    const topic = await Topic.findOne({
      where: { id: req.params.id, user_id: req.user.id }
    });

    if (!topic) {
      await transaction.rollback();
      return res.status(404).json({
        message: 'Topic not found or you do not have permission to delete it'
      });
    }

    // 1. Manually delete related records to ensure cascading
    // Delete materials
    const materials = await db.Material.findAll({ where: { topic_id: topic.id } });
    for (const material of materials) {
      const filePath = path.join(__dirname, '../../uploads/materials', material.uploaded_file);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    await db.Material.destroy({ where: { topic_id: topic.id }, transaction });

    // Delete topic progress
    await TopicProgress.destroy({ where: { topic_id: topic.id }, transaction });

    // Delete quizzes (and let their internal cascade/cleanup happen if models support it, otherwise manual)
    await db.Quiz.destroy({ where: { topic_id: topic.id }, transaction });

    // Delete notes
    await db.Note.destroy({ where: { topic_id: topic.id }, transaction });

    // 2. Delete the topic itself
    await topic.destroy({ transaction });

    await transaction.commit();

    // 3. Clean up RAG/Vector Store (after successful DB commit)
    try {
      const ragService = require('../services/rag');
      await ragService.deleteTopicData(req.user.id, topic.id);
      console.log(`[LOG deleteTopic] ========= Deleted RAG data for topic ${topic.id}`);
    } catch (ragError) {
      console.error('[LOG deleteTopic] ========= Error deleting RAG data:', ragError);
      // Don't fail the request if just RAG cleanup fails, but log it
    }

    res.json({ message: 'Topic deleted successfully' });
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error('Error deleting topic:', error);
    res.status(500).json({ message: 'Error deleting topic', error: error.message });
  }
};

module.exports = {
  getTopics,
  getTopic,
  createTopic,
  updateTopic,
  deleteTopic
}; 