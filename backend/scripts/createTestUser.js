// backend/scripts/createTestUser.js
const bcrypt = require('bcryptjs');
const db = require('../models');

async function createTestUser() {
  try {
    // 데이터베이스 연결 확인
    await db.sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공');

    // 기존 테스트 사용자 확인
    const existingUser = await db.User.findOne({
      where: { email: 'test@gmail.com' }
    });

    if (existingUser) {
      console.log('✅ 테스트 사용자가 이미 존재합니다:', existingUser.email);
      return;
    }

    // 비밀번호 해시화
    const hashedPassword = await bcrypt.hash('qwerqwer', 10);

    // 테스트 사용자 생성
    const testUser = await db.User.create({
      email: 'test@gmail.com',
      username: 'testuser',
      full_name: '테스트 사용자',
      password_hash: hashedPassword,
      provider: 'local',
      survey_completed: false,
      is_active: true,
      email_verified: true,
      current_level: 1,
      experience_points: 0
    });

    console.log('✅ 테스트 사용자 생성 완료:', {
      user_id: testUser.user_id,
      email: testUser.email,
      username: testUser.username
    });

  } catch (error) {
    console.error('❌ 테스트 사용자 생성 실패:', error);
  } finally {
    await db.sequelize.close();
  }
}

createTestUser();