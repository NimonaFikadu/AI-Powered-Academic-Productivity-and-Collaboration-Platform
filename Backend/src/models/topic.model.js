const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Topic = sequelize.define('Topic', {
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
    user_id: {
      type: DataTypes.CHAR(36),
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'SET NULL'
    },
    is_public: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    tableName: 'topics',
    timestamps: true,
    underscored: true
  });

  Topic.associate = (models) => {
    Topic.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'creator'
    });
  };

  return Topic;
}; 