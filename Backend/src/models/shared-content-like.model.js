const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const SharedContentLike = sequelize.define('SharedContentLike', {
    id: {
      type: DataTypes.CHAR(36),
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    shared_content_id: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      references: {
        model: 'shared_content',
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
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'shared_content_likes',
    timestamps: false,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['shared_content_id', 'user_id']
      }
    ]
  });

  SharedContentLike.associate = (models) => {
    SharedContentLike.belongsTo(models.SharedContent, {
      foreignKey: 'shared_content_id',
      as: 'sharedContent'
    });
    
    SharedContentLike.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
  };

  return SharedContentLike;
}; 