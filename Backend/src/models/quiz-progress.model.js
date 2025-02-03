const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const QuizProgress = sequelize.define('QuizProgress', {
    id: {
      type: DataTypes.CHAR(36),
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    quiz_id: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      references: {
        model: 'quizzes',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    progress: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 100
      }
    },
    best_score: {
      type: DataTypes.FLOAT,
      allowNull: true,
      validate: {
        min: 0,
        max: 100
      }
    },
    attempts_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    last_attempt_date: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'quiz_progress',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'quiz_id']
      }
    ]
  });

  QuizProgress.associate = (models) => {
    QuizProgress.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
    QuizProgress.belongsTo(models.Quiz, {
      foreignKey: 'quiz_id',
      as: 'quiz'
    });
  };

  return QuizProgress;
}; 