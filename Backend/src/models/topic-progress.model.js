const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const TopicProgress = sequelize.define('TopicProgress', {
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
    topic_id: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      references: {
        model: 'topics',
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
    last_activity: {
      type: DataTypes.DATE,
      allowNull: true
    },
    materials_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    }
  }, {
    tableName: 'topic_progress',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'topic_id']
      }
    ]
  });

  TopicProgress.associate = (models) => {
    TopicProgress.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
    TopicProgress.belongsTo(models.Topic, {
      foreignKey: 'topic_id',
      as: 'topic'
    });
  };

  return TopicProgress;
}; 