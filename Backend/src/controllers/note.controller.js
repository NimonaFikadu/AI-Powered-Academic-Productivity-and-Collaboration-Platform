const { v4: uuidv4 } = require('uuid');
const sequelize = require('../config/database');
const db = require('../models');
const ragService = require('../services/rag');
const { format } = require('date-fns');

/**
 * Get all notes for the current user
 */
const getNotes = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  const { topicId } = req.query;

  try {
    let whereClause = 'WHERE n.user_id = ?';
    const replacements = [req.user.id];

    if (topicId) {
      whereClause += ' AND n.topic_id = ?';
      replacements.push(topicId);
    }

    // Get total count
    const [countResult] = await sequelize.query(
      `SELECT COUNT(*) as total 
       FROM notes n 
       ${whereClause}`,
      {
        replacements,
        type: sequelize.QueryTypes.SELECT,
      }
    );

    // Get notes
    const notes = await sequelize.query(
      `SELECT n.*, t.title as topic, u.username as creator_name
       FROM notes n
       LEFT JOIN topics t ON n.topic_id = t.id
       LEFT JOIN users u ON n.user_id = u.id
       ${whereClause}
       ORDER BY n.created_at DESC
       LIMIT ? OFFSET ?`,
      {
        replacements: [...replacements, limit, offset],
        type: sequelize.QueryTypes.SELECT,
      }
    );

    // Format notes to match the required response format
    const formattedNotes = notes.map(note => ({
      id: note.id,
      title: note.title,
      topic: note.topic || 'Uncategorized',
      topicId: note.topic_id,
      date: format(new Date(note.created_at), 'MMM d, yyyy'),
      content: note.content,
      readTime: note.read_time || '3 min read',
      created_at: note.created_at,
      updated_at: note.updated_at,
      user_id: note.user_id
    }));

    res.json({
      notes: formattedNotes,
      pagination: {
        total: countResult.total,
        page,
        totalPages: Math.ceil(countResult.total / limit)
      }
    });
  } catch (error) {
    console.error('[LOG getNotes] ========= Error fetching notes:', error);
    res.status(500).json({ message: 'Error fetching notes' });
  }
};

/**
 * Get a specific note by ID
 */
const getNote = async (req, res) => {
  try {
    const [note] = await sequelize.query(
      `SELECT n.*, t.title as topic, t.is_public as topic_is_public, t.user_id as topic_user_id, u.username as creator_name
       FROM notes n
       LEFT JOIN topics t ON n.topic_id = t.id
       LEFT JOIN users u ON n.user_id = u.id
       WHERE n.id = ?`,
      {
        replacements: [req.params.id],
        type: sequelize.QueryTypes.SELECT,
      }
    );

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }
    
    // Visibility check: must be owner or topic must be public
    if (note.topic_user_id !== req.user.id && !note.topic_is_public) {
      return res.status(404).json({ message: 'Note not found or is private' });
    }

    console.log("[ACCESS] Note", {
      topicId: note.topic_id,
      noteId: note.id,
      requester: req.user.id,
      owner: note.topic_user_id,
      isPublic: note.topic_is_public
    });

    // Format note to match the required response format
    const formattedNote = {
      id: note.id,
      title: note.title,
      topic: note.topic || 'Uncategorized',
      topicId: note.topic_id,
      date: format(new Date(note.created_at), 'MMM d, yyyy'),
      content: note.content,
      readTime: note.read_time || '3 min read',
      created_at: note.created_at,
      updated_at: note.updated_at,
      user_id: note.user_id,
      user_goal: note.user_goal || ''
    };

    res.json(formattedNote);
  } catch (error) {
    console.error('[LOG getNote] ========= Error fetching note:', error);
    res.status(500).json({ message: 'Error fetching note' });
  }
};

/**
 * Get notes for a specific topic
 */
const getNotesByTopic = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  const { topicId } = req.params;

  try {
    if (!topicId) {
      return res.status(400).json({ message: 'Topic ID is required' });
    }

    // Verify topic exists AND is accessible
    const [topic] = await sequelize.query(
      'SELECT id, title, is_public, user_id FROM topics WHERE id = ?',
      {
        replacements: [topicId],
        type: sequelize.QueryTypes.SELECT,
      }
    );

    if (!topic || (!topic.is_public && topic.user_id !== req.user.id)) {
      return res.status(404).json({ message: 'Topic not found or access denied' });
    }

    console.log("[ACCESS]", {
      topicId,
      requester: req.user.id,
      owner: topic.user_id,
      isPublic: topic.is_public
    });

    let whereClause = 'WHERE n.topic_id = ?';
    const replacements = [topicId];

    // Get total count
    const [countResult] = await sequelize.query(
      `SELECT COUNT(*) as total 
       FROM notes n 
       ${whereClause}`,
      {
        replacements,
        type: sequelize.QueryTypes.SELECT,
      }
    );

    // Get notes
    const notes = await sequelize.query(
      `SELECT n.*, u.username as creator_name
       FROM notes n
       LEFT JOIN users u ON n.user_id = u.id
       ${whereClause}
       ORDER BY n.created_at DESC
       LIMIT ? OFFSET ?`,
      {
        replacements: [...replacements, limit, offset],
        type: sequelize.QueryTypes.SELECT,
      }
    );

    // Format notes to match the required response format
    const formattedNotes = notes.map(note => ({
      id: note.id,
      title: note.title,
      topic: topic.title,
      topicId: note.topic_id,
      date: format(new Date(note.created_at), 'MMM d, yyyy'),
      content: note.content,
      readTime: note.read_time || '3 min read',
      created_at: note.created_at,
      updated_at: note.updated_at,
      user_id: note.user_id
    }));

    res.json({
      notes: formattedNotes,
      pagination: {
        total: countResult.total,
        page,
        totalPages: Math.ceil(countResult.total / limit)
      }
    });
  } catch (error) {
    console.error('[LOG getNotesByTopic] ========= Error fetching notes by topic:', error);
    res.status(500).json({ message: 'Error fetching notes by topic' });
  }
};


/**
 * Delete a note
 */
const deleteNote = async (req, res) => {
  try {
    const [result, metadata] = await sequelize.query(
      'DELETE FROM notes WHERE id = ? AND user_id = ?',
      {
        replacements: [req.params.id, req.user.id],
      }
    );

    // PostgreSQL returns rowCount in metadata; MySQL returns affectedRows in result
    const affectedRows = (metadata && metadata.rowCount != null)
      ? metadata.rowCount
      : (result && result.affectedRows != null ? result.affectedRows : 0);

    if (affectedRows === 0) {
      return res.status(404).json({
        message: 'Note not found or you do not have permission to delete it'
      });
    }

    res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    console.error('[LOG deleteNote] ========= Error deleting note:', error);
    res.status(500).json({ message: 'Error deleting note' });
  }
};

module.exports = {
  getNotes,
  getNote,
  getNotesByTopic,
  deleteNote
}; 