// backend/models/testSession.js
module.exports = (sequelize, DataTypes) => {
  const TestSession = sequelize.define(
    'TestSession',
    {
      session_id: {
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
      test_type: {
        type: DataTypes.ENUM('placement', 'progress', 'practice'),
        allowNull: false,
        defaultValue: 'practice',
      },
      status: {
        type: DataTypes.ENUM('active', 'paused', 'completed', 'abandoned'),
        allowNull: false,
        defaultValue: 'active',
      },
      current_stage: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      total_stages: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 5,
      },
      start_time: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      end_time: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      pause_duration: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Total pause time in seconds',
      },
      session_config: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Test configuration and parameters',
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: 'test_sessions',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
      indexes: [
        { fields: ['user_id'] },
        { fields: ['status'] },
        { fields: ['test_type'] },
        { fields: ['created_at'] },
      ],
    }
  );

  TestSession.associate = (models) => {
    // User와의 관계
    TestSession.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
    });

    // TestStage와의 관계
    if (models.TestStage) {
      TestSession.hasMany(models.TestStage, {
        foreignKey: 'session_id',
        as: 'stages',
      });
    }

    // UserResponse와의 관계
    if (models.UserResponse) {
      TestSession.hasMany(models.UserResponse, {
        foreignKey: 'session_id',
        as: 'responses',
      });
    }

    // TestResult와의 관계
    if (models.TestResult) {
      TestSession.hasOne(models.TestResult, {
        foreignKey: 'session_id',
        as: 'result',
      });
    }
  };

  return TestSession;
};