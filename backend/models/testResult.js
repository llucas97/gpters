// backend/models/testResult.js
module.exports = (sequelize, DataTypes) => {
  const TestResult = sequelize.define(
    'TestResult',
    {
      result_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      session_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        references: {
          model: 'test_sessions',
          key: 'session_id',
        },
        onDelete: 'CASCADE',
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
      overall_score: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0.00,
        validate: {
          min: 0,
          max: 100,
        },
      },
      accuracy_rate: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0.00,
        validate: {
          min: 0,
          max: 100,
        },
      },
      average_response_time: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Average response time in milliseconds',
      },
      consistency_score: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0.00,
        validate: {
          min: 0,
          max: 100,
        },
      },
      assigned_level: {
        type: DataTypes.ENUM('beginner', 'intermediate', 'advanced'),
        allowNull: false,
        defaultValue: 'beginner',
      },
      previous_level: {
        type: DataTypes.ENUM('beginner', 'intermediate', 'advanced'),
        allowNull: true,
      },
      level_change: {
        type: DataTypes.ENUM('promoted', 'maintained', 'demoted'),
        allowNull: false,
        defaultValue: 'maintained',
      },
      feedback_text: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      improvement_areas: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Areas that need improvement',
      },
      strengths: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'User strengths identified',
      },
      detailed_metrics: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Detailed performance metrics',
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: 'test_results',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: false,
      underscored: true,
      indexes: [
        { fields: ['user_id'] },
        { fields: ['session_id'] },
        { fields: ['assigned_level'] },
        { fields: ['overall_score'] },
        { fields: ['created_at'] },
      ],
    }
  );

  TestResult.associate = (models) => {
    // TestSession과의 관계
    TestResult.belongsTo(models.TestSession, {
      foreignKey: 'session_id',
      as: 'session',
    });

    // User와의 관계
    TestResult.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
    });
  };

  return TestResult;
};