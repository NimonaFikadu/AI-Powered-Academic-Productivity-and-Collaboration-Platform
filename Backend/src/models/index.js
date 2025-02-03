const sequelize = require('../config/database');
const User = require('./user.model');
const TopicModel = require('./topic.model');
const QuizModel = require('./quiz.model');
const QuizAttemptModel = require('./quiz-attempt.model');
const StudySessionModel = require('./study-session.model');
const TopicProgressModel = require('./topic-progress.model');
const NoteProgressModel = require('./note-progress.model');
const QuizProgressModel = require('./quiz-progress.model');
const MaterialModel = require('./material.model');
const SharedContentModel = require('./shared-content.model');
const SharedContentLikeModel = require('./shared-content-like.model');
const SharedContentCommentModel = require('./shared-content-comment.model');
const NoteModel = require('./note.model');
const CalendarEventModel = require('./calendar-event.model');
const EventParticipantModel = require('./event-participant.model');
const QuizQuestionModel = require('./quiz-question.model');
const QuizQuestionOptionModel = require('./quiz-question-option.model');
const TransactionModel = require('./transaction.model');

// Initialize models with sequelize instance
const Topic = TopicModel(sequelize);
const Quiz = QuizModel(sequelize);
const QuizAttempt = QuizAttemptModel(sequelize);
const StudySession = StudySessionModel(sequelize);
const TopicProgress = TopicProgressModel(sequelize);
const NoteProgress = NoteProgressModel(sequelize);
const QuizProgress = QuizProgressModel(sequelize);
const Material = MaterialModel(sequelize);
const SharedContent = SharedContentModel(sequelize);
const SharedContentLike = SharedContentLikeModel(sequelize);
const SharedContentComment = SharedContentCommentModel(sequelize);
const Note = NoteModel(sequelize);
const CalendarEvent = CalendarEventModel(sequelize);
const EventParticipant = EventParticipantModel(sequelize);
const QuizQuestion = QuizQuestionModel(sequelize);
const QuizQuestionOption = QuizQuestionOptionModel(sequelize);
const Transaction = TransactionModel(sequelize);

const models = {
  User,
  Topic,
  Quiz,
  QuizAttempt,
  StudySession,
  TopicProgress,
  NoteProgress,
  QuizProgress,
  Material,
  SharedContent,
  SharedContentLike,
  SharedContentComment,
  Note,
  CalendarEvent,
  EventParticipant,
  QuizQuestion,
  QuizQuestionOption,
  Transaction
};

// Initialize associations
Object.values(models).forEach(model => {
  if (model.associate) {
    model.associate(models);
  }
});

module.exports = {
  sequelize,
  ...models
}; 