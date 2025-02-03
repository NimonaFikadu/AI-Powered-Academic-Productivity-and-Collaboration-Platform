const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Quiz = sequelize.define('Quiz', {
    id: {
      type: DataTypes.CHAR(36),
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    topic_id: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      references: {
        model: 'topics',
        key: 'id'
      }
    },
    user_id: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    difficulty: {
      type: DataTypes.ENUM('easy', 'medium', 'hard'),
      defaultValue: 'medium'
    },
    is_public: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    is_ai_generated: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    questions: {
      type: DataTypes.JSON, // For backward compatibility or RAG metadata
      allowNull: true
    }
  }, {
    tableName: 'quizzes',
    timestamps: true,
    underscored: true
  });

  Quiz.associate = (models) => {
    Quiz.belongsTo(models.Topic, {
      foreignKey: 'topic_id',
      as: 'topic'
    });
    Quiz.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'creator'
    });
    Quiz.hasMany(models.QuizQuestion, {
      foreignKey: 'quiz_id',
      as: 'quizQuestions'
    });
    Quiz.hasMany(models.QuizAttempt, {
      foreignKey: 'quiz_id',
      as: 'attempts'
    });
  };

  return Quiz;
}; 