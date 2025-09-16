// models/levelTestResult.js
module.exports = (sequelize, DataTypes) => {
  const LevelTestResult = sequelize.define('LevelTestResult', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
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
    level: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0,
        max: 5
      }
    },
    score: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    total_questions: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    correct_answers: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    answers: {
      type: DataTypes.TEXT,
      allowNull: true, // JSON 문자열로 저장
    },
    completed_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'level_test_results',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true,
  });

  // 모델 관계 설정
  LevelTestResult.associate = (models) => {
    LevelTestResult.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
    });
  };

  return LevelTestResult;
};