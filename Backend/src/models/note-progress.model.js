const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const NoteProgress = sequelize.define('NoteProgress', {
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
    note_id: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      references: {
        model: 'notes',
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
    last_read_position: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      comment: 'Position in characters where the user last stopped reading'
    }
  }, {
    tableName: 'note_progress',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'note_id']
      }
    ]
  });

  NoteProgress.associate = (models) => {
    NoteProgress.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
    NoteProgress.belongsTo(models.Note, {
      foreignKey: 'note_id',
      as: 'note'
    });
  };

  return NoteProgress;
}; 