'use strict';

module.exports = (sequelize, DataTypes) => {
  const UserExperience = sequelize.define('UserExperience', {
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
      },
      comment: '사용자 ID'
    },
    totalExperience: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '총 경험치'
    },
    level: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      comment: '현재 레벨'
    },
    currentLevelExp: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '현재 레벨에서의 경험치'
    },
    expToNextLevel: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 100,
      comment: '다음 레벨까지 필요한 경험치'
    },
    progressPercentage: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '현재 레벨 진행률 (%)'
    },
    lastLevelUpAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '마지막 레벨업 시간'
    },
    totalLevelUps: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '총 레벨업 횟수'
    },
    highestLevel: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      comment: '최고 레벨'
    },
    experienceHistory: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '경험치 획득 이력'
    },
    achievements: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '획득한 성취도'
    },
    dailyExperience: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '오늘 획득한 경험치'
    },
    weeklyExperience: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '이번 주 획득한 경험치'
    },
    monthlyExperience: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '이번 달 획득한 경험치'
    },
    lastExperienceReset: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '마지막 경험치 리셋 시간'
    }
  }, {
    tableName: 'user_experience',
    timestamps: true,
    indexes: [
      { fields: ['userId'] },
      { fields: ['level'] },
      { fields: ['totalExperience'] },
      { fields: ['lastLevelUpAt'] },
      { fields: ['userId', 'level'] }
    ]
  });

  // 관계 설정
  UserExperience.associate = (models) => {
    // 사용자와의 관계
    UserExperience.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
  };

  return UserExperience;
};
