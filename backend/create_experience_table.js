const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const db = require('./models');

async function createExperienceTable() {
  try {
    console.log('🔄 데이터베이스 연결 중...');
    await db.sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공\n');
    
    console.log('🔄 user_experience 테이블 생성/수정 중...');
    
    // force: false = 테이블이 없으면 생성, 있으면 유지
    // alter: true = 테이블 구조 수정 (컬럼 추가/변경)
    await db.UserExperience.sync({ alter: true });
    
    console.log('✅ user_experience 테이블 생성/수정 완료\n');
    
    console.log('🔍 테이블 구조 확인 중...');
    const [results] = await db.sequelize.query('DESCRIBE user_experience');
    console.log('테이블 컬럼:');
    console.table(results);
    
    console.log('\n🔍 사용자 ID 22의 경험치 데이터 확인 중...');
    let userExp = await db.UserExperience.findOne({
      where: { user_id: 22 }
    });
    
    if (userExp) {
      console.log('✅ 기존 경험치 데이터 발견:');
      console.log(JSON.stringify(userExp.toJSON(), null, 2));
    } else {
      console.log('⚠️  경험치 데이터 없음. 새로 생성합니다...\n');
      userExp = await db.UserExperience.create({
        user_id: 22,
        totalExperience: 0,
        level: 1,
        currentLevelExp: 0,
        expToNextLevel: 100,
        progressPercentage: 0,
        totalLevelUps: 0,
        highestLevel: 1,
        dailyExperience: 0,
        weeklyExperience: 0,
        monthlyExperience: 0
      });
      console.log('✅ 새 경험치 데이터 생성:');
      console.log(JSON.stringify(userExp.toJSON(), null, 2));
    }
    
    console.log('\n🎉 모든 작업 완료!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ 오류 발생:');
    console.error(error);
    process.exit(1);
  }
}

createExperienceTable();

