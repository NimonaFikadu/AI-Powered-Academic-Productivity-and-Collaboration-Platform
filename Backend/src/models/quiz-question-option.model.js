const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const QuizQuestionOption = sequelize.define('QuizQuestionOption', {
        id: {
            type: DataTypes.CHAR(36),
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        question_id: {
            type: DataTypes.CHAR(36),
            allowNull: false,
            references: {
                model: 'quiz_questions',
                key: 'id'
            },
            onDelete: 'CASCADE'
        },
        option_text: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        is_correct: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        order_index: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        }
    }, {
        tableName: 'quiz_question_options',
        timestamps: true,
        underscored: true
    });

    QuizQuestionOption.associate = (models) => {
        QuizQuestionOption.belongsTo(models.QuizQuestion, {
            foreignKey: 'question_id',
            as: 'question'
        });
    };

    return QuizQuestionOption;
};
