const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const SharedContent = sequelize.define('SharedContent', {
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
      }
    },
    content_type: {
      type: DataTypes.ENUM('topic', 'quiz'),
      allowNull: false
    },
    content_url: {
      type: DataTypes.STRING(500),
      allowNull: false
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    tags: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: []
    },
    likes_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    comments_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
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
    tableName: 'shared_content',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['content_type']
      },
      {
        fields: ['created_at']
      }
    ]
  });

  SharedContent.associate = (models) => {
    SharedContent.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'author'
    });
    
    SharedContent.hasMany(models.SharedContentLike, {
      foreignKey: 'shared_content_id',
      as: 'likes'
    });
    
    SharedContent.hasMany(models.SharedContentComment, {
      foreignKey: 'shared_content_id',
      as: 'comments'
    });
  };

  return SharedContent;
}; 