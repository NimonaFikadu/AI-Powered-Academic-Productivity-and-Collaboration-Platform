const {
  Quiz,
  QuizQuestion,
  QuizQuestionOption,
  QuizAttempt,
  QuizProgress,
  Topic,
  User
} = require('../models');
const { Op } = require('sequelize');
const ragService = require('../services/rag');

const getQuizzes = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  const { topicId } = req.query;

  try {
    const where = { user_id: req.user.id };
    if (topicId) {
      where.topic_id = topicId;
    }

    const { count, rows: quizzes } = await Quiz.findAndCountAll({
      where,
      include: [
        { model: Topic, as: 'topic', attributes: ['title'] },
        { model: User, as: 'creator', attributes: ['username'] },
        { model: QuizQuestion, as: 'quizQuestions', attributes: ['id'] },
        { model: QuizAttempt, as: 'attempts', attributes: ['id'] }
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset,
      distinct: true
    });

    const formattedQuizzes = quizzes.map(quiz => {
      const plainQuiz = quiz.get({ plain: true });
      return {
        ...plainQuiz,
        topic_title: plainQuiz.topic ? plainQuiz.topic.title : null,
        creator_name: plainQuiz.creator ? plainQuiz.creator.username : null,
        question_count: plainQuiz.quizQuestions ? plainQuiz.quizQuestions.length : 0,
        attempt_count: plainQuiz.attempts ? plainQuiz.attempts.length : 0
      };
    });

    res.json({
      quizzes: formattedQuizzes,
      pagination: {
        total: count,
        page,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('[LOG quiz] ========= Error fetching quizzes:', error);
    res.status(500).json({
      message: 'Error fetching quizzes',
      error: error.message,
      stack: error.toString()
    });
  }
};

const getQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findOne({
      where: { id: req.params.id },
      include: [
        { model: Topic, as: 'topic', attributes: ['title', 'is_public', 'user_id'] },
        { model: User, as: 'creator', attributes: ['username'] },
        {
          model: QuizQuestion,
          as: 'quizQuestions',
          include: [{ model: QuizQuestionOption, as: 'options' }]
        }
      ]
    });

    // Enforce visibility: MUST be the creator OR the parent topic must be public
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    
    if (quiz.user_id !== req.user.id) {
      if (!quiz.topic || (!quiz.topic.is_public && quiz.topic.user_id !== req.user.id)) {
        return res.status(404).json({ message: 'Quiz not found or is private' });
      }
    }

    console.log("[ACCESS] Quiz", {
      topicId: quiz.topic ? quiz.topic.id : null,
      quizId: quiz.id,
      requester: req.user.id,
      owner: quiz.topic ? quiz.topic.user_id : quiz.user_id,
      isPublic: quiz.topic ? quiz.topic.is_public : false
    });

    const plainQuiz = quiz.get({ plain: true });

    const questionsWithOptions = plainQuiz.quizQuestions.map(question => ({
      id: question.id,
      question: question.question,
      questionType: question.question_type,
      quiz_id: question.quiz_id,
      options: question.options.map(opt => opt.option_text)
    }));

    res.status(200).json({
      quiz: {
        ...plainQuiz,
        topic_title: plainQuiz.topic ? plainQuiz.topic.title : null,
        creator_name: plainQuiz.creator ? plainQuiz.creator.username : null
      },
      questions: questionsWithOptions
    });
  } catch (error) {
    console.error('Error fetching quiz:', error);
    res.status(500).json({ message: 'Error fetching quiz' });
  }
};

const getQuizzesByTopic = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  const { topicId } = req.params;

  try {
    const topic = await Topic.findOne({ 
      where: { 
        id: topicId,
        [Op.or]: [
          { user_id: req.user.id },
          { is_public: true }
        ]
      } 
    });
    if (!topic) {
      return res.status(404).json({ message: 'Topic not found or access denied' });
    }

    console.log("[ACCESS]", {
      topicId,
      requester: req.user.id,
      owner: topic.user_id,
      isPublic: topic.is_public
    });

    const { count, rows: quizzes } = await Quiz.findAndCountAll({
      where: { topic_id: topicId },
      include: [
        { model: Topic, as: 'topic', attributes: ['title'] },
        { model: User, as: 'creator', attributes: ['username'] },
        { model: QuizQuestion, as: 'quizQuestions', attributes: ['id'] },
        { model: QuizAttempt, as: 'attempts', attributes: ['id'] }
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset,
      distinct: true
    });

    const formattedQuizzes = quizzes.map(quiz => {
      const plainQuiz = quiz.get({ plain: true });
      return {
        ...plainQuiz,
        topic_title: plainQuiz.topic ? plainQuiz.topic.title : null,
        creator_name: plainQuiz.creator ? plainQuiz.creator.username : null,
        question_count: plainQuiz.quizQuestions ? plainQuiz.quizQuestions.length : 0,
        attempt_count: plainQuiz.attempts ? plainQuiz.attempts.length : 0
      };
    });

    res.json({
      quizzes: formattedQuizzes,
      pagination: {
        total: count,
        page,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('[LOG quiz] ========= Error fetching quizzes by topic:', error);
    res.status(500).json({
      message: 'Error fetching quizzes by topic',
      error: error.message,
      stack: error.toString()
    });
  }
};

const createRagQuiz = async (req, res) => {
  try {
    const { title, difficulty, numQuestions, topicId } = req.body;

    if (!title || !topicId) {
      return res.status(400).json({ message: 'Title and topic ID are required' });
    }

    const topic = await Topic.findOne({ where: { id: topicId, user_id: req.user.id } });
    if (!topic) {
      return res.status(404).json({ message: 'Topic not found or does not belong to user' });
    }

    const quizDifficulty = difficulty || 'medium';
    const questionCount = parseInt(numQuestions) || 5;

    const generatedQuiz = await ragService.generateQuiz({
      title,
      difficulty: quizDifficulty,
      numQuestions: questionCount,
      userId: req.user.id,
      topicId
    });

    if (!generatedQuiz || !generatedQuiz.questions || generatedQuiz.questions.length === 0) {
      return res.status(500).json({ message: 'Failed to generate quiz questions' });
    }

    const quiz = await Quiz.create({
      id: generatedQuiz.quiz.id,
      title: generatedQuiz.quiz.title,
      description: generatedQuiz.quiz.description,
      topic_id: topicId,
      user_id: req.user.id,
      difficulty: quizDifficulty,
      is_ai_generated: true
    });

    for (const questionData of generatedQuiz.questions) {
      const question = await QuizQuestion.create({
        quiz_id: quiz.id,
        question: questionData.question,
        question_type: questionData.questionType || 'multiple_choice',
        correct_answer: questionData.correctAnswer,
        order_index: 0
      });

      if (questionData.options && Array.isArray(questionData.options)) {
        for (let i = 0; i < questionData.options.length; i++) {
          const optionText = questionData.options[i];
          await QuizQuestionOption.create({
            question_id: question.id,
            option_text: optionText,
            is_correct: optionText === questionData.correctAnswer,
            order_index: i
          });
        }
      }
    }

    res.status(201).json({
      message: 'Quiz generated successfully',
      quiz: {
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        difficulty: quiz.difficulty,
        topic_id: quiz.topic_id,
        question_count: generatedQuiz.questions.length
      }
    });
  } catch (error) {
    console.error('[LOG quiz] ========= Error generating RAG quiz:', error);
    res.status(500).json({ message: 'Error generating RAG quiz' });
  }
};

const submitQuizAttempt = async (req, res) => {
  const { answers } = req.body;
  const quizId = req.params.id;

  try {
    if (!answers || typeof answers !== 'object') {
      return res.status(400).json({ message: 'Invalid answers format. Answers must be an object.' });
    }

    const quiz = await Quiz.findOne({ where: { id: quizId, user_id: req.user.id } });
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found or access denied' });
    }

    const questions = await QuizQuestion.findAll({ where: { quiz_id: quizId } });
    if (questions.length === 0) {
      return res.status(404).json({ message: 'No questions found for this quiz' });
    }

    let correctCount = 0;
    for (const question of questions) {
      if (answers[question.id] === question.correct_answer) {
        correctCount++;
      }
    }

    const scorePercentage = (correctCount / questions.length) * 100;

    const attempt = await QuizAttempt.create({
      user_id: req.user.id,
      quiz_id: quizId,
      score: scorePercentage,
      answers: answers,
      completed_at: new Date()
    });

    // Update quiz progress
    let [quizProgress, created] = await QuizProgress.findOrCreate({
      where: { user_id: req.user.id, quiz_id: quizId },
      defaults: {
        progress: scorePercentage >= 70 ? 100 : scorePercentage,
        best_score: scorePercentage,
        attempts_count: 1,
        last_attempt_date: new Date()
      }
    });

    if (!created) {
      quizProgress.attempts_count += 1;
      quizProgress.last_attempt_date = new Date();
      if (quizProgress.best_score === null || scorePercentage > quizProgress.best_score) {
        quizProgress.best_score = scorePercentage;
      }
      const newProgress = scorePercentage >= 70 ? 100 : Math.max(quizProgress.progress, scorePercentage);
      quizProgress.progress = newProgress;
      await quizProgress.save();
    }

    res.json({
      message: 'Quiz attempt submitted successfully',
      attemptId: attempt.id,
      score: scorePercentage,
      totalQuestions: questions.length,
      correctAnswers: correctCount
    });
  } catch (error) {
    console.error('[LOG quiz] ========= Error submitting quiz attempt:', error);
    res.status(500).json({ message: 'Error submitting quiz attempt' });
  }
};

const getQuizAttempts = async (req, res) => {
  try {
    // Verify quiz ownership first
    const quiz = await Quiz.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found or access denied' });
    }

    const attempts = await QuizAttempt.findAll({
      where: { quiz_id: req.params.id, user_id: req.user.id },
      include: [{ model: User, as: 'user', attributes: ['username'] }],
      order: [['completed_at', 'DESC']]
    });

    const formattedAttempts = attempts.map(attempt => {
      const plain = attempt.get({ plain: true });
      return {
        ...plain,
        username: plain.User ? plain.User.username : 'Unknown'
      };
    });

    res.json(formattedAttempts);
  } catch (error) {
    console.error('Error fetching quiz attempts:', error);
    res.status(500).json({ message: 'Error fetching quiz attempts' });
  }
};

module.exports = {
  getQuizzes,
  getQuiz,
  getQuizzesByTopic,
  createRagQuiz,
  submitQuizAttempt,
  getQuizAttempts
}; 