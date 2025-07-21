// models/survey.js
module.exports = (sequelize, DataTypes) => {
  const Survey = sequelize.define('Survey', {
    survey_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users', // ✅ 반드시 Users와 대소문자 일치
        key: 'user_id',
      },
      onDelete: 'CASCADE',
    },
    job_title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    learning_purpose: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    current_skill_level: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    motivation: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    time_availability: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    preferred_language: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  }, {
    tableName: 'surveys', // ✅ 실제 테이블명 명시
    timestamps: true,     // createdAt, updatedAt 포함 여부
  });

  // 모델 관계 설정
  Survey.associate = (models) => {
    Survey.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
    });
  };

  return Survey;
};
