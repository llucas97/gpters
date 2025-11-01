const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const db = require('./models');

async function checkProgressData() {
  try {
    console.log('🔍 학습 진도 데이터 확인\n');
    
    await db.sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공\n');
    
    const userId = 22;
    
    // 1. study_sessions 테이블 확인
    console.log('1️⃣ study_sessions 테이블 데이터:');
    const [sessions] = await db.sequelize.query(`
      SELECT * FROM study_sessions 
      WHERE user_id = :userId 
      LIMIT 10
    `, {
      replacements: { userId },
      type: db.sequelize.QueryTypes.SELECT
    });
    
    if (sessions.length === 0) {
      console.log('❌ study_sessions 테이블에 데이터가 없습니다!\n');
    } else {
      console.table(sessions);
    }
    
    // 2. 전체 레코드 수
    const [count] = await db.sequelize.query(`
      SELECT COUNT(*) as total FROM study_sessions 
      WHERE user_id = :userId
    `, {
      replacements: { userId },
      type: db.sequelize.QueryTypes.SELECT
    });
    console.log(`\n총 레코드 수: ${count[0].total}\n`);
    
    // 3. API 쿼리 테스트 (해결한 문제)
    console.log('2️⃣ 해결한 문제 수 (is_correct = 1인 고유 problem_id):');
    const [solved] = await db.sequelize.query(`
      SELECT 
        COUNT(DISTINCT CASE WHEN is_correct = 1 THEN problem_id END) as solvedCount,
        COUNT(DISTINCT problem_id) as attemptedCount
      FROM study_sessions
      WHERE user_id = :userId AND is_correct IS NOT NULL
    `, {
      replacements: { userId },
      type: db.sequelize.QueryTypes.SELECT
    });
    console.log('결과:', solved[0]);
    
    // 4. 테이블 구조 확인
    console.log('\n3️⃣ study_sessions 테이블 구조:');
    const [structure] = await db.sequelize.query('DESCRIBE study_sessions');
    console.table(structure);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 오류:', error);
    process.exit(1);
  }
}

checkProgressData();

