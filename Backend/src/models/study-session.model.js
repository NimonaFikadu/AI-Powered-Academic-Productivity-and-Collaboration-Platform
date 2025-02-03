const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const StudySession = sequelize.define('StudySession', {
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
    study_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    hours: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        min: 0
      }
    },
    productivity_score: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 0,
        max: 100
      }
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'study_sessions',
    timestamps: true,
    underscored: true
  });

  StudySession.associate = (models) => {
    StudySession.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
  };

  return StudySession;
}; 