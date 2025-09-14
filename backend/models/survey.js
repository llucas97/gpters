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
        model: 'users', // ✅ 실제 테이블명과 일치
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
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 4
      }
    },
    motivation: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    time_availability: {
      type: DataTypes.STRING,
      allowNull: true, // optional로 변경
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
