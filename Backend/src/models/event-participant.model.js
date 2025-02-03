const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const EventParticipant = sequelize.define('EventParticipant', {
        id: {
            type: DataTypes.CHAR(36),
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        event_id: {
            type: DataTypes.CHAR(36),
            allowNull: false,
            references: {
                model: 'calendar_events',
                key: 'id'
            },
            onDelete: 'CASCADE'
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
        tableName: 'event_participants',
        timestamps: true,
        underscored: true
    });

    EventParticipant.associate = (models) => {
        EventParticipant.belongsTo(models.CalendarEvent, {
            foreignKey: 'event_id',
            as: 'event'
        });

        EventParticipant.belongsTo(models.User, {
            foreignKey: 'user_id',
            as: 'participant'
        });
    };

    return EventParticipant;
};
