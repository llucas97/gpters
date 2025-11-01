const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const db = require('./models');
const UserExperienceService = require('./services/userExperienceService');

async function testExperienceAPI() {
  try {
    console.log('🧪 경험치 API 테스트 시작\n');
    
    await db.sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공\n');
    
    const userId = 22;
    
    // 1. 사용자 경험치 정보 조회
    console.log('1️⃣ getUserExperience 테스트:');
    const expResult = await UserExperienceService.getUserExperience(userId);
    console.log('결과:', JSON.stringify(expResult, null, 2));
    console.log();
    
    // 2. 사용자 경험치 통계 조회
    console.log('2️⃣ getUserExperienceStats 테스트:');
    const statsResult = await UserExperienceService.getUserExperienceStats(userId);
    console.log('결과:', JSON.stringify(statsResult, null, 2));
    console.log();
    
    // 3. 레벨 순위 조회
    console.log('3️⃣ getLevelRanking 테스트:');
    const rankingResult = await UserExperienceService.getLevelRanking(10);
    console.log('결과:', JSON.stringify(rankingResult, null, 2));
    console.log();
    
    console.log('✅ 모든 테스트 완료!');
    process.exit(0);
  } catch (error) {
    console.error('❌ 테스트 실패:', error);
    process.exit(1);
  }
}

testExperienceAPI();

