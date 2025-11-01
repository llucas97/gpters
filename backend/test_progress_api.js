const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const express = require('express');
const app = require('./app');
const db = require('./models');

async function testProgressAPI() {
  try {
    console.log('🧪 학습 진도 API 테스트\n');
    
    await db.sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공\n');
    
    const userId = 22;
    
    // 직접 쿼리 실행
    console.log('1️⃣ 기본 통계 쿼리:');
    const stats = await db.sequelize.query(`
      SELECT 
        COUNT(DISTINCT CASE WHEN is_correct = 1 THEN problem_id END) as solvedCount,
        COUNT(DISTINCT problem_id) as attemptedCount,
        ROUND(AVG(CASE WHEN is_correct = 1 THEN 100 ELSE 0 END), 1) as successRate,
        ROUND(AVG(score), 1) as avgScore,
        COUNT(*) as totalAttempts,
        SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as totalCorrect
      FROM study_sessions
      WHERE user_id = :userId AND is_correct IS NOT NULL
    `, {
      replacements: { userId },
      type: db.sequelize.QueryTypes.SELECT
    });
    
    console.log('결과:', stats[0]);
    console.log();
    
    // 2. 전체 데이터 확인
    console.log('2️⃣ study_sessions 데이터 확인:');
    const sessions = await db.sequelize.query(`
      SELECT 
        id, 
        problem_id,
        problem_title,
        is_correct,
        score,
        level
      FROM study_sessions
      WHERE user_id = :userId
      ORDER BY id DESC
      LIMIT 10
    `, {
      replacements: { userId },
      type: db.sequelize.QueryTypes.SELECT
    });
    
    console.table(sessions);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 오류:', error);
    process.exit(1);
  }
}

testProgressAPI();

