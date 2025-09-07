// backend/models/userResponse.js
module.exports = (sequelize, DataTypes) => {
  const UserResponse = sequelize.define(
    'UserResponse',
    {
      response_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      session_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'test_sessions',
          key: 'session_id',
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
      stage_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'test_stages',
          key: 'stage_id',
        },
        onDelete: 'SET NULL',
      },
      user_answer: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      correct_answer: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      is_correct: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      response_time: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Response time in milliseconds',
      },
      attempt_count: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      hints_used: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      submitted_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: 'user_responses',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: false,
      underscored: true,
      indexes: [
        { fields: ['session_id'] },
        { fields: ['problem_id'] },
        { fields: ['stage_id'] },
        { fields: ['is_correct'] },
        { fields: ['submitted_at'] },
      ],
    }
  );

  UserResponse.associate = (models) => {
    // TestSession과의 관계
    UserResponse.belongsTo(models.TestSession, {
      foreignKey: 'session_id',
      as: 'session',
    });

    // Problem과의 관계
    UserResponse.belongsTo(models.Problem, {
      foreignKey: 'problem_id',
      as: 'problem',
    });

    // TestStage와의 관계
    if (models.TestStage) {
      UserResponse.belongsTo(models.TestStage, {
        foreignKey: 'stage_id',
        as: 'stage',
      });
    }
  };

  return UserResponse;
};