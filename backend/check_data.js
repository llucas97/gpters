const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const db = require('./models');

async function checkData() {
  try {
    await db.sequelize.authenticate();
    console.log('✅ DB 연결 성공\n');
    
    const userId = 22;
    
    // 0. 테이블 구조 확인
    console.log('0️⃣ study_sessions 테이블 구조:');
    const structure = await db.sequelize.query('DESCRIBE study_sessions');
    console.table(structure[0]);
    
    // 1. 최근 study_sessions 확인
    console.log('\n1️⃣ study_sessions (최근 3개):');
    const sessions = await db.sequelize.query(
      'SELECT * FROM study_sessions WHERE user_id = :userId ORDER BY id DESC LIMIT 3',
      { replacements: { userId }, type: db.sequelize.QueryTypes.SELECT }
    );
    console.table(sessions);
    
    // 2. user_experience 확인
    console.log('\n2️⃣ user_experience:');
    const exp = await db.sequelize.query(
      'SELECT * FROM user_experience WHERE user_id = :userId',
      { replacements: { userId }, type: db.sequelize.QueryTypes.SELECT }
    );
    console.table(exp);
    
    // 3. 통계 확인
    console.log('\n3️⃣ 학습 진도 통계:');
    const stats = await db.sequelize.query(`
      SELECT 
        COUNT(DISTINCT CASE WHEN is_correct = 1 THEN COALESCE(problem_id, id) END) as solvedCount,
        COUNT(DISTINCT COALESCE(problem_id, id)) as attemptedCount,
        COUNT(*) as totalAttempts,
        SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as totalCorrect
      FROM study_sessions
      WHERE user_id = :userId AND is_correct IS NOT NULL
    `, {
      replacements: { userId },
      type: db.sequelize.QueryTypes.SELECT
    });
    console.log(stats[0]);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 오류:', error);
    process.exit(1);
  }
}

checkData();

