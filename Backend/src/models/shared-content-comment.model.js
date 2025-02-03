const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const SharedContentComment = sequelize.define('SharedContentComment', {
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
    comment: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'shared_content_comments',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['shared_content_id']
      },
      {
        fields: ['user_id']
      }
    ]
  });

  SharedContentComment.associate = (models) => {
    SharedContentComment.belongsTo(models.SharedContent, {
      foreignKey: 'shared_content_id',
      as: 'sharedContent'
    });
    
    SharedContentComment.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'author'
    });
  };

  return SharedContentComment;
}; 