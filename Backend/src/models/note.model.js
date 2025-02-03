const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Note = sequelize.define('Note', {
        id: {
            type: DataTypes.CHAR(36),
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        title: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: true
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
        is_private: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        topic_id: {
            type: DataTypes.CHAR(36),
            allowNull: true,
            references: {
                model: 'topics',
                key: 'id'
            },
            onDelete: 'SET NULL'
        },
        read_time: {
            type: DataTypes.STRING(20),
            allowNull: true,
            comment: 'Estimated reading time for the note'
        },
        user_goal: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'User goal for generating the note'
        }
    }, {
        tableName: 'notes',
        timestamps: true,
        underscored: true
    });

    Note.associate = (models) => {
        Note.belongsTo(models.User, {
            foreignKey: 'user_id',
            as: 'author'
        });
        Note.belongsTo(models.Topic, {
            foreignKey: 'topic_id',
            as: 'topic'
        });
        Note.hasMany(models.NoteProgress, {
            foreignKey: 'note_id',
            as: 'progress_entries'
        });
    };

    return Note;
};
