// backend/models/submission.js
module.exports = (sequelize, DataTypes) => {
  const Submission = sequelize.define(
    'Submission',
    {
      submission_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'user_id',
        },
        onDelete: 'CASCADE',
      },
      problem_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'problems',
          key: 'problem_id',
        },
        onDelete: 'CASCADE',
      },
      submitted_code: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      result: {
        type: DataTypes.ENUM('correct', 'incorrect', 'error', 'timeout'),
        allowNull: false,
      },
      score: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      execution_time_ms: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      memory_usage_kb: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      error_message: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      submitted_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'submissions',
      timestamps: false,
      underscored: true,
      indexes: [
        { fields: ['user_id'] },
        { fields: ['problem_id'] },
        { fields: ['result'] },
        { fields: ['submitted_at'] },
      ],
    }
  );

  Submission.associate = (models) => {
    // User와의 관계
    Submission.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
    });

    // Problem과의 관계
    Submission.belongsTo(models.Problem, {
      foreignKey: 'problem_id',
      as: 'problem',
    });
  };

  return Submission;
};