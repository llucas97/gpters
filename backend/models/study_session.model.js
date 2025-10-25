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
    boj_step: { type: DataTypes.INTEGER, allowNull: true },
    source: { type: DataTypes.ENUM('bank', 'quiz'), allowNull: false, defaultValue: 'bank' },
    problem_id: { type: DataTypes.BIGINT, allowNull: true },
    
    // ✅ 문제 유형 추가
    problem_type: { 
      type: DataTypes.ENUM('block', 'cloze', 'code_editor', 'ordering', 'bug_fix'), 
      allowNull: false, 
      defaultValue: 'cloze',
      comment: '문제 유형: 블록코딩, 빈칸채우기, 코드에디터, 순서배열, 버그수정'
    },
    
    // ✅ 문제 제목과 설명 추가
    problem_title: { type: DataTypes.STRING(255), allowNull: true },
    problem_description: { type: DataTypes.TEXT, allowNull: true },
    
    started_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    finished_at: { type: DataTypes.DATE, allowNull: true },
    duration_ms: { type: DataTypes.INTEGER, allowNull: true },
    
    // ✅ 채점 결과 필드들
    blanks_total: { type: DataTypes.INTEGER, allowNull: false },
    blanks_correct: { type: DataTypes.INTEGER, allowNull: false },
    accuracy: { type: DataTypes.DECIMAL(5,2), allowNull: true },
    blanks_detail: { type: DataTypes.JSON, allowNull: false },
    
    // ✅ 추가 채점 정보
    score: { 
      type: DataTypes.INTEGER, 
      allowNull: true,
      validate: { min: 0, max: 100 },
      comment: '채점 점수 (0-100)'
    },
    is_correct: { 
      type: DataTypes.BOOLEAN, 
      allowNull: true,
      comment: '전체 문제 정답 여부'
    },
    user_answer: { 
      type: DataTypes.JSON, 
      allowNull: true,
      comment: '사용자 답안 데이터'
    },
    grading_result: { 
      type: DataTypes.JSON, 
      allowNull: true,
      comment: '상세 채점 결과'
    },
    feedback: { 
      type: DataTypes.TEXT, 
      allowNull: true,
      comment: '채점 피드백 메시지'
    },
    
    // ✅ 시도 관련 정보
    attempt_count: { 
      type: DataTypes.INTEGER, 
      allowNull: false, 
      defaultValue: 1,
      comment: '같은 문제에 대한 시도 횟수'
    },
    is_first_attempt: { 
      type: DataTypes.BOOLEAN, 
      allowNull: false, 
      defaultValue: true,
      comment: '첫 번째 시도 여부'
    }
  }, {
    tableName: 'study_sessions',
    underscored: true,
    timestamps: false,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['problem_id'] },
      { fields: ['problem_type'] },
      { fields: ['level'] },
      { fields: ['is_correct'] },
      { fields: ['started_at'] },
      { fields: ['user_id', 'problem_id'] },
      { fields: ['user_id', 'level'] },
      { fields: ['user_id', 'problem_type'] }
    ]
  });
  return StudySession;
};
