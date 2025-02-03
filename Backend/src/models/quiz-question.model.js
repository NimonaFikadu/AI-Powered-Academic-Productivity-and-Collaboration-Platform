const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const QuizQuestion = sequelize.define('QuizQuestion', {
        id: {
            type: DataTypes.CHAR(36),
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        quiz_id: {
            type: DataTypes.CHAR(36),
            allowNull: false,
            references: {
                model: 'quizzes',
                key: 'id'
            },
            onDelete: 'CASCADE'
        },
        question: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        question_type: {
            type: DataTypes.STRING,
            defaultValue: 'multiple_choice'
        },
        correct_answer: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        order_index: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        }
    }, {
        tableName: 'quiz_questions',
        timestamps: true,
        underscored: true
    });

    QuizQuestion.associate = (models) => {
        QuizQuestion.belongsTo(models.Quiz, {
            foreignKey: 'quiz_id',
            as: 'quiz'
        });
        QuizQuestion.hasMany(models.QuizQuestionOption, {
            foreignKey: 'question_id',
            as: 'options'
        });
    };

    return QuizQuestion;
};
