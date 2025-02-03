const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const CalendarEvent = sequelize.define('CalendarEvent', {
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
        start_time: {
            type: DataTypes.DATE,
            allowNull: false
        },
        end_time: {
            type: DataTypes.DATE,
            allowNull: false
        },
        type: {
            type: DataTypes.ENUM('personal', 'tutoring', 'study_group', 'group'),
            allowNull: false,
            defaultValue: 'personal'
        },
        location: {
            type: DataTypes.STRING,
            allowNull: true
        },
        is_online: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        meeting_link: {
            type: DataTypes.STRING,
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
        }
    }, {
        tableName: 'calendar_events',
        timestamps: true,
        underscored: true
    });

    CalendarEvent.associate = (models) => {
        CalendarEvent.belongsTo(models.User, {
            foreignKey: 'user_id',
            as: 'creator'
        });

        CalendarEvent.belongsToMany(models.User, {
            through: 'event_participants',
            foreignKey: 'event_id',
            otherKey: 'user_id',
            as: 'participants'
        });
    };

    return CalendarEvent;
};
