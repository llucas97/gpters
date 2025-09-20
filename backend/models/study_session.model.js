'use strict';
module.exports = (sequelize, DataTypes) => {
  const StudySession = sequelize.define('StudySession', {
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.STRING(128), allowNull: true },   // 로그인된 사용자 ID
    handle: { type: DataTypes.STRING(64), allowNull: false },
    client_id: { type: DataTypes.STRING(64), allowNull: true },   // ✅ 추가
    language: { type: DataTypes.STRING(32), allowNull: false },
    topic: { type: DataTypes.STRING(64), allowNull: false },
    level: { type: DataTypes.INTEGER, allowNull: false },
    source: { type: DataTypes.ENUM('bank', 'quiz'), allowNull: false, defaultValue: 'bank' },
    problem_id: { type: DataTypes.BIGINT, allowNull: true },
    started_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    finished_at: { type: DataTypes.DATE, allowNull: true },
    duration_ms: { type: DataTypes.INTEGER, allowNull: true },
    blanks_total: { type: DataTypes.INTEGER, allowNull: false },
    blanks_correct: { type: DataTypes.INTEGER, allowNull: false },
    accuracy: { type: DataTypes.DECIMAL(5,2), allowNull: true },
    blanks_detail: { type: DataTypes.JSON, allowNull: false }
  }, {
    tableName: 'study_sessions',
    underscored: true,
    timestamps: false
  });
  return StudySession;
};
