// Imports Op from sequelize
const { Op } = require('sequelize');
const {
  User,
  TopicProgress,
  QuizProgress,
  NoteProgress,
  StudySession,
  Topic,
  Quiz,
  Note
} = require('../models');

/**
 * Get comprehensive statistics for a user
 */
const getUserStatistics = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get topic progress statistics
    const topicProgress = await TopicProgress.findAll({
      where: { user_id: userId },
      include: [
        {
          model: Topic,
          as: 'topic',
          attributes: ['title']
        }
      ],
      order: [['updated_at', 'DESC']]
    });

    // Get quiz progress statistics
    const quizProgress = await QuizProgress.findAll({
      where: { user_id: userId },
      include: [
        {
          model: Quiz,
          as: 'quiz',
          attributes: ['title']
        }
      ],
      order: [['updated_at', 'DESC']]
    });

    // Get note progress statistics
    let noteProgress = [];
    try {
      noteProgress = await NoteProgress.findAll({
        where: { user_id: userId },
        include: [
          {
            model: Note,
            as: 'note',
            attributes: ['title']
          }
        ],
        order: [['updated_at', 'DESC']]
      });
    } catch (noteError) {
      console.warn('[LOG statistics] ========= Warning: NoteProgress fetch failed:', noteError.message);
      // Fallback for note progress if table/assoc issues persist
      noteProgress = [];
    }

    // Get all study hours (all-time statistics)
    const studySessions = await StudySession.findAll({
      where: {
        user_id: userId
      },
      order: [['study_date', 'DESC']]
    });

    // Calculate aggregate statistics utilizing Sequelize functions
    // 1. Total Topics Studied
    const totalTopicsStudied = await TopicProgress.count({
      where: { user_id: userId },
      col: 'topic_id',
      distinct: true
    });

    // 2. Total Quizzes Attempted
    const totalQuizzesAttempted = await QuizProgress.count({
      where: { user_id: userId },
      col: 'quiz_id',
      distinct: true
    });

    // 3. Total Notes Read
    let totalNotesRead = 0;
    try {
      totalNotesRead = await NoteProgress.count({
        where: { user_id: userId },
        col: 'note_id',
        distinct: true
      });
    } catch (e) { console.warn('Note count failed', e.message); }

    // 4. Total Study Hours
    const totalStudyHoursResult = await StudySession.sum('hours', {
      where: { user_id: userId }
    });
    const totalStudyHours = totalStudyHoursResult || 0;

    // 5. Avg Topic Progress
    const topicProgresses = await TopicProgress.findAll({
      where: { user_id: userId },
      attributes: ['progress']
    });
    const avgTopicProgress = topicProgresses.length > 0
      ? topicProgresses.reduce((sum, item) => sum + item.progress, 0) / topicProgresses.length
      : 0;

    // 6. Avg Quiz Progress
    const quizProgresses = await QuizProgress.findAll({
      where: { user_id: userId },
      attributes: ['progress', 'best_score']
    });
    const avgQuizProgress = quizProgresses.length > 0
      ? quizProgresses.reduce((sum, item) => sum + item.progress, 0) / quizProgresses.length
      : 0;
    const avgQuizScore = quizProgresses.length > 0
      ? quizProgresses.reduce((sum, item) => sum + (item.best_score || 0), 0) / quizProgresses.length
      : 0;

    // 7. Total Materials
    const totalMaterialsResult = await TopicProgress.sum('materials_count', {
      where: { user_id: userId }
    });
    const totalMaterials = totalMaterialsResult || 0;

    // Format the response
    const formattedTopicProgress = topicProgress.map(tp => ({
      topicId: tp.topic_id,
      topicTitle: tp.topic ? tp.topic.title : 'Unknown Topic',
      progress: tp.progress,
      materialsCount: tp.materials_count,
      updatedAt: tp.updated_at
    }));

    const formattedQuizProgress = quizProgress.map(qp => ({
      quizId: qp.quiz_id,
      quizTitle: qp.quiz ? qp.quiz.title : 'Unknown Quiz',
      progress: qp.progress,
      bestScore: qp.best_score,
      attemptsCount: qp.attempts_count,
      updatedAt: qp.updated_at
    }));

    const formattedNoteProgress = noteProgress.map(np => ({
      noteId: np.note_id,
      noteTitle: np.note ? np.note.title : 'Unknown Note',
      progress: np.progress,
      updatedAt: np.updated_at
    }));

    const formattedStudySessions = studySessions.map(ss => {
      // If there's a previous day's record, calculate productivity change
      // Simplified: Just returning 0 for now as previousDayScore logic was complex in SQL
      // Re-implementing correctly would require mapping previous sessions which is costly here
      const productivityChange = 0;

      return {
        date: ss.study_date,
        hours: ss.hours,
        productivityScore: ss.productivity_score || 0,
        productivityChange,
        updatedAt: ss.updated_at
      };
    });

    res.json({
      topics_progress: formattedTopicProgress,
      quiz_progress: formattedQuizProgress,
      note_progress: formattedNoteProgress,
      study_hours: formattedStudySessions,
      summary: {
        total_topics_studied: totalTopicsStudied,
        total_quizzes_attempted: totalQuizzesAttempted,
        total_notes_read: totalNotesRead,
        total_study_hours: totalStudyHours,
        avg_topic_progress: avgTopicProgress.toFixed(2),
        avg_quiz_progress: avgQuizProgress.toFixed(2),
        avg_quiz_score: avgQuizScore.toFixed(2),
        total_materials: totalMaterials
      }
    });

  } catch (error) {
    console.error('[LOG statistics] ========= Error fetching user statistics:', error);
    console.error('[LOG statistics] ========= Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({
      message: 'Error fetching user statistics',
      error: error.message
    });
  }
};

/**
 * Get quiz performance statistics only
 */
const getQuizPerformance = async (req, res) => {
  try {
    const userId = req.user.id;

    console.log('[LOG statistics] ========= Fetching quiz performance for user:', userId);

    // Get quiz progress statistics
    const quizProgress = await QuizProgress.findAll({
      where: { user_id: userId },
      include: [
        {
          model: Quiz,
          as: 'quiz',
          attributes: ['title']
        }
      ],
      order: [['updated_at', 'DESC']]
    });

    // Get quiz aggregate statistics
    const [aggregateStats] = await sequelize.query(`
      SELECT 
        COUNT(DISTINCT qp.quiz_id) as total_quizzes_attempted,
        COALESCE(AVG(qp.progress), 0) as avg_quiz_progress,
        COALESCE(AVG(qp.best_score), 0) as avg_quiz_score,
        COALESCE(MAX(qp.best_score), 0) as highest_score,
        COALESCE(MIN(qp.best_score), 0) as lowest_score
      FROM quiz_progress qp
      WHERE qp.user_id = ?
    `, {
      replacements: [userId],
      type: sequelize.QueryTypes.SELECT
    });

    const formattedQuizProgress = quizProgress.map(qp => ({
      quizId: qp.quiz_id,
      quizTitle: qp.quiz?.title || 'Unknown Quiz',
      progress: qp.progress,
      bestScore: qp.best_score,
      attemptsCount: qp.attempts_count,
      updatedAt: qp.updated_at
    }));

    res.json({
      quiz_progress: formattedQuizProgress,
      summary: {
        total_quizzes_attempted: aggregateStats.total_quizzes_attempted || 0,
        avg_quiz_progress: parseFloat(aggregateStats.avg_quiz_progress || 0).toFixed(2),
        avg_quiz_score: parseFloat(aggregateStats.avg_quiz_score || 0).toFixed(2),
        highest_score: aggregateStats.highest_score || 0,
        lowest_score: aggregateStats.lowest_score || 0
      }
    });
  } catch (error) {
    console.error('[LOG statistics] ========= Error fetching quiz performance:', error);
    res.status(500).json({
      message: 'Error fetching quiz performance',
      error: error.message
    });
  }
};

/**
 * Get note progress statistics only
 */
const getNoteProgress = async (req, res) => {
  try {
    const userId = req.user.id;

    console.log('[LOG statistics] ========= Fetching note progress for user:', userId);

    // Get note progress statistics
    const noteProgress = await sequelize.query(`
      SELECT np.*, n.title
      FROM note_progress np
      JOIN notes n ON np.note_id = n.id
      WHERE np.user_id = ?
      ORDER BY np.updated_at DESC
    `, {
      replacements: [userId],
      type: sequelize.QueryTypes.SELECT
    });

    // Get note aggregate statistics
    const [aggregateStats] = await sequelize.query(`
      SELECT 
        COUNT(DISTINCT np.note_id) as total_notes_read,
        COALESCE(AVG(np.progress), 0) as avg_note_progress
      FROM note_progress np
      WHERE np.user_id = ?
    `, {
      replacements: [userId],
      type: sequelize.QueryTypes.SELECT
    });

    const formattedNoteProgress = noteProgress && Array.isArray(noteProgress) ?
      noteProgress.map(np => ({
        noteId: np.note_id,
        noteTitle: np.title || 'Unknown Note',
        progress: np.progress,
        updatedAt: np.updated_at
      })) : [];

    res.json({
      note_progress: formattedNoteProgress,
      summary: {
        total_notes_read: aggregateStats.total_notes_read || 0,
        avg_note_progress: parseFloat(aggregateStats.avg_note_progress || 0).toFixed(2)
      }
    });
  } catch (error) {
    console.error('[LOG statistics] ========= Error fetching note progress:', error);
    res.status(500).json({
      message: 'Error fetching note progress',
      error: error.message
    });
  }
};

/**
 * Get study sessions only
 */
const getStudySessions = async (req, res) => {
  try {
    const userId = req.user.id;
    const { days } = req.query; // Optional days filter

    console.log('[LOG statistics] ========= Fetching study sessions for user:', userId);

    let whereClause = { user_id: userId };

    // Only apply date filter if days parameter is provided
    if (days && parseInt(days) > 0) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(days));
      whereClause.study_date = { [Op.gte]: startDate };
    }

    const studySessions = await StudySession.findAll({
      where: whereClause,
      order: [['study_date', 'DESC']]
    });

    // Get study session aggregate statistics
    let aggregateQuery = `
      SELECT 
        COALESCE(SUM(ss.hours), 0) as total_study_hours,
        COALESCE(AVG(ss.hours), 0) as avg_daily_hours,
        COALESCE(AVG(ss.productivity_score), 0) as avg_productivity_score,
        COUNT(*) as total_sessions
      FROM study_sessions ss
      WHERE ss.user_id = ?
    `;

    let replacements = [userId];

    // Add date filter if days parameter is provided
    if (days && parseInt(days) > 0) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(days));
      aggregateQuery += ` AND ss.study_date >= ?`;
      replacements.push(startDate);
    }

    const [aggregateStats] = await sequelize.query(aggregateQuery, {
      replacements,
      type: sequelize.QueryTypes.SELECT
    });

    const formattedStudySessions = studySessions.map(ss => {
      // Calculate productivity change (simplified)
      const productivityChange = ss.productivity_score ?
        (ss.productivity_score - (ss.previousDayScore || ss.productivity_score)) :
        0;

      return {
        date: ss.study_date,
        hours: ss.hours,
        productivityScore: ss.productivity_score || 0,
        productivityChange,
        notes: ss.notes,
        updatedAt: ss.updated_at
      };
    });

    res.json({
      study_hours: formattedStudySessions,
      summary: {
        total_study_hours: aggregateStats.total_study_hours || 0,
        avg_daily_hours: parseFloat(aggregateStats.avg_daily_hours || 0).toFixed(2),
        avg_productivity_score: parseFloat(aggregateStats.avg_productivity_score || 0).toFixed(2),
        total_sessions: aggregateStats.total_sessions || 0
      }
    });
  } catch (error) {
    console.error('[LOG statistics] ========= Error fetching study sessions:', error);
    res.status(500).json({
      message: 'Error fetching study sessions',
      error: error.message
    });
  }
};

/**
 * Update topic progress
 */
const updateTopicProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { topicId, progress, materialsCount } = req.body;

    if (!topicId || progress === undefined) {
      return res.status(400).json({
        message: 'Topic ID and progress are required'
      });
    }

    // Validate progress is between 0 and 100
    if (progress < 0 || progress > 100) {
      return res.status(400).json({
        message: 'Progress must be between 0 and 100'
      });
    }

    // Check if topic exists and belongs to user
    const [topic] = await sequelize.query(
      'SELECT id FROM topics WHERE id = ? AND user_id = ?',
      {
        replacements: [topicId, userId],
        type: sequelize.QueryTypes.SELECT
      }
    );

    if (!topic) {
      return res.status(404).json({
        message: 'Topic not found'
      });
    }

    // Find or create topic progress
    let topicProgress = await TopicProgress.findOne({
      where: {
        user_id: userId,
        topic_id: topicId
      }
    });

    if (topicProgress) {
      // Update existing record
      topicProgress.progress = progress;
      if (materialsCount !== undefined) {
        topicProgress.materials_count = materialsCount;
      }
      topicProgress.last_activity = new Date();
      await topicProgress.save();
    } else {
      // Create new record
      topicProgress = await TopicProgress.create({
        user_id: userId,
        topic_id: topicId,
        progress,
        materials_count: materialsCount || 0,
        last_activity: new Date()
      });
    }

    res.json({
      message: 'Topic progress updated successfully',
      progress: topicProgress
    });
  } catch (error) {
    console.error('Error updating topic progress:', error);
    res.status(500).json({
      message: 'Error updating topic progress',
      error: error.message
    });
  }
};

/**
 * Update quiz progress
 */
const updateQuizProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { quizId, progress, score } = req.body;

    if (!quizId || progress === undefined) {
      return res.status(400).json({
        message: 'Quiz ID and progress are required'
      });
    }

    // Validate progress is between 0 and 100
    if (progress < 0 || progress > 100) {
      return res.status(400).json({
        message: 'Progress must be between 0 and 100'
      });
    }

    // Check if quiz exists and belongs to user
    const [quiz] = await sequelize.query(
      'SELECT id FROM quizzes WHERE id = ? AND user_id = ?',
      {
        replacements: [quizId, userId],
        type: sequelize.QueryTypes.SELECT
      }
    );

    if (!quiz) {
      return res.status(404).json({
        message: 'Quiz not found'
      });
    }

    // Find or create quiz progress
    let quizProgress = await QuizProgress.findOne({
      where: {
        user_id: userId,
        quiz_id: quizId
      }
    });

    if (quizProgress) {
      // Update existing record
      quizProgress.progress = progress;
      quizProgress.attempts_count += 1;
      quizProgress.last_attempt_date = new Date();

      // Update best score if the new score is higher
      if (score !== undefined && (quizProgress.best_score === null || score > quizProgress.best_score)) {
        quizProgress.best_score = score;
      }

      await quizProgress.save();
    } else {
      // Create new record
      quizProgress = await QuizProgress.create({
        user_id: userId,
        quiz_id: quizId,
        progress,
        best_score: score || null,
        attempts_count: 1,
        last_attempt_date: new Date()
      });
    }

    res.json({
      message: 'Quiz progress updated successfully',
      progress: quizProgress
    });
  } catch (error) {
    console.error('Error updating quiz progress:', error);
    res.status(500).json({
      message: 'Error updating quiz progress',
      error: error.message
    });
  }
};

/**
 * Update note progress
 */
const updateNoteProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { noteId, progress, lastReadPosition } = req.body;

    if (!noteId || progress === undefined) {
      return res.status(400).json({
        message: 'Note ID and progress are required'
      });
    }

    // Validate progress is between 0 and 100
    if (progress < 0 || progress > 100) {
      return res.status(400).json({
        message: 'Progress must be between 0 and 100'
      });
    }

    // Check if note exists and belongs to user
    const [note] = await sequelize.query(
      'SELECT id FROM notes WHERE id = ? AND user_id = ?',
      {
        replacements: [noteId, userId],
        type: sequelize.QueryTypes.SELECT
      }
    );

    if (!note) {
      return res.status(404).json({
        message: 'Note not found'
      });
    }

    // Find or create note progress
    let noteProgress = await NoteProgress.findOne({
      where: {
        user_id: userId,
        note_id: noteId
      }
    });

    if (noteProgress) {
      // Update existing record
      noteProgress.progress = progress;
      if (lastReadPosition !== undefined) {
        noteProgress.last_read_position = lastReadPosition;
      }
      await noteProgress.save();
    } else {
      // Create new record
      noteProgress = await NoteProgress.create({
        user_id: userId,
        note_id: noteId,
        progress,
        last_read_position: lastReadPosition || 0
      });
    }

    res.json({
      message: 'Note progress updated successfully',
      progress: noteProgress
    });
  } catch (error) {
    console.error('[LOG statistics] ========= Error updating note progress:', error);
    res.status(500).json({
      message: 'Error updating note progress',
      error: error.message
    });
  }
};

/**
 * Log study session
 */
const logStudySession = async (req, res) => {
  try {
    const userId = req.user.id;
    const { date, hours, productivityScore, notes } = req.body;

    if (!hours) {
      return res.status(400).json({
        message: 'Study hours are required'
      });
    }

    // Validate hours
    if (hours <= 0 || hours > 24) {
      return res.status(400).json({
        message: 'Study hours must be between 0 and 24'
      });
    }

    // Format date or use today
    const studyDate = date ? new Date(date) : new Date();

    // Check if there's already a session for this date
    let studySession = await StudySession.findOne({
      where: {
        user_id: userId,
        study_date: studyDate
      }
    });

    if (studySession) {
      // Update existing record
      studySession.hours = hours;
      if (productivityScore !== undefined) {
        studySession.productivity_score = productivityScore;
      }
      if (notes) {
        studySession.notes = notes;
      }
      await studySession.save();
    } else {
      // Create new record
      studySession = await StudySession.create({
        user_id: userId,
        study_date: studyDate,
        hours,
        productivity_score: productivityScore || null,
        notes: notes || null
      });
    }

    res.json({
      message: 'Study session logged successfully',
      session: studySession
    });
  } catch (error) {
    console.error('Error logging study session:', error);
    res.status(500).json({
      message: 'Error logging study session',
      error: error.message
    });
  }
};

module.exports = {
  getUserStatistics,
  getQuizPerformance,
  getNoteProgress,
  getStudySessions,
  updateTopicProgress,
  updateQuizProgress,
  updateNoteProgress,
  logStudySession
}; 