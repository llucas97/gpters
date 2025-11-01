const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const GradingResult = sequelize.define('GradingResult', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    problemId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    problemType: {
      type: DataTypes.ENUM('block', 'cloze'),
      allowNull: false
    },
    level: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    userAnswer: {
      type: DataTypes.JSON,
      allowNull: false,
      comment: '사용자 답안 데이터 (블록 또는 텍스트 입력)'
    },
    score: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0,
        max: 100
      }
    },
    isCorrect: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    correctCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    totalCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    results: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '개별 답안별 상세 결과'
    },
    feedback: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '채점 피드백 메시지'
    },
    userCode: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '사용자가 생성한 최종 코드 (블록코딩의 경우)'
    },
    codeValidation: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '코드 검증 결과'
    },
    levelBonus: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: '레벨별 보너스 점수 적용 여부'
    },
    timeSpent: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '문제 해결에 소요된 시간 (초)'
    },
    attemptCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      comment: '같은 문제에 대한 시도 횟수'
    }
  }, {
    tableName: 'grading_results',
    timestamps: true,
    indexes: [
      {
        fields: ['userId']
      },
      {
        fields: ['problemId']
      },
      {
        fields: ['problemType']
      },
      {
        fields: ['level']
      },
      {
        fields: ['isCorrect']
      },
      {
        fields: ['createdAt']
      },
      {
        fields: ['userId', 'problemId']
      },
      {
        fields: ['userId', 'level']
      }
    ]
  });

  // 관계 설정
  GradingResult.associate = (models) => {
    // 사용자와의 관계
    GradingResult.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
  };

  return GradingResult;
};
