const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const QuizAttempt = sequelize.define('QuizAttempt', {
    id: {
      type: DataTypes.STRING(36),
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    quiz_id: {
      type: DataTypes.STRING(36),
      allowNull: false,
      references: {
        model: 'quizzes',
        key: 'id'
      }
    },
    user_id: {
      type: DataTypes.STRING(36),
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    answers: {
      type: DataTypes.JSON,
      allowNull: false
    },
    score: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        min: 0,
        max: 100
      }
    },
    timeSpent: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 0
      }
    },
    completed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    tableName: 'quiz_attempts',
    timestamps: true,
    underscored: true
  });

  QuizAttempt.associate = (models) => {
    QuizAttempt.belongsTo(models.Quiz, {
      foreignKey: 'quiz_id',
      as: 'quiz'
    });
    QuizAttempt.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
  };

  return QuizAttempt;
}; 