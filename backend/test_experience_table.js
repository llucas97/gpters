const db = require('./models');

async function testExperienceTable() {
  try {
    console.log('데이터베이스 연결 테스트...');
    await db.sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공');
    
    console.log('\nUserExperience 테이블 동기화...');
    await db.UserExperience.sync({ alter: true });
    console.log('✅ UserExperience 테이블 동기화 완료');
    
    console.log('\n테이블 정보 확인...');
    const tableInfo = await db.sequelize.query(
      "DESCRIBE user_experience",
      { type: db.sequelize.QueryTypes.SELECT }
    );
    console.log('테이블 컬럼:', tableInfo);
    
    console.log('\n사용자 ID 22의 경험치 데이터 확인...');
    const userExp = await db.UserExperience.findOne({
      where: { user_id: 22 }
    });
    
    if (userExp) {
      console.log('✅ 기존 경험치 데이터:', userExp.toJSON());
    } else {
      console.log('❌ 경험치 데이터 없음. 새로 생성합니다...');
      const newExp = await db.UserExperience.create({
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
      console.log('✅ 새 경험치 데이터 생성:', newExp.toJSON());
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

testExperienceTable();

