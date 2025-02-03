const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Material = sequelize.define('Material', {
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
    file_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    uploaded_file: {
      type: DataTypes.STRING,
      allowNull: false
    },
    file_type: {
      type: DataTypes.ENUM('pdf', 'image', 'ppt', 'docx'),
      allowNull: false
    },
    file_size: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    tableName: 'materials',
    timestamps: true,
    underscored: true
  });

  Material.associate = (models) => {
    Material.belongsTo(models.Topic, {
      foreignKey: 'topic_id',
      as: 'topic'
    });
    Material.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'creator'
    });
  };

  return Material;
}; 