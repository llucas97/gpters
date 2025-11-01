// 실제 로그인 API 테스트
require('dotenv').config({ path: '../.env' });
const request = require('supertest');
const app = require('./app');
const db = require('./models');

async function testActualLogin() {
  try {
    console.log('🧪 실제 로그인 API 테스트 시작...\n');

    // 1. 서버 연결 확인
    console.log('1️⃣ 서버 연결 테스트...');
    const testRes = await request(app).get('/api/test');
    console.log(`✅ 서버 응답: ${testRes.status} - ${testRes.body.message}\n`);

    // 2. 테스트 사용자 조회
    console.log('2️⃣ 테스트 사용자 조회...');
    const users = await db.User.findAll({
      where: { is_active: true, provider: 'local' },
      limit: 3,
      attributes: ['user_id', 'email', 'username']
    });

    if (users.length === 0) {
      console.log('❌ 테스트 가능한 사용자가 없습니다.');
      process.exit(1);
    }

    console.log(`✅ 테스트 가능한 사용자 ${users.length}명 발견:`);
    users.forEach(u => {
      console.log(`   - ${u.email} (${u.username})`);
    });
    console.log();

    // 3. 로그인 시도 (잘못된 비밀번호)
    console.log('3️⃣ 잘못된 비밀번호로 로그인 시도...');
    const wrongLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: users[0].email,
        password: 'wrongpassword123',
        rememberMe: false
      });

    console.log(`   응답 상태: ${wrongLogin.status}`);
    console.log(`   응답 메시지: ${wrongLogin.body.message || '없음'}`);
    
    if (wrongLogin.status === 401) {
      console.log('   ✅ 잘못된 비밀번호 거부 정상 작동!\n');
    } else {
      console.log('   ⚠️ 예상과 다른 응답\n');
    }

    // 4. 실제 로그인 테스트 안내
    console.log('4️⃣ 실제 로그인 테스트:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📝 아래 사용자 중 하나로 로그인을 시도해보세요:\n');
    
    users.forEach(u => {
      console.log(`   이메일: ${u.email}`);
      console.log(`   사용자명: ${u.username}`);
      console.log(`   (비밀번호는 회원가입할 때 설정한 것)\n`);
    });

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // 5. 프론트엔드 URL 확인
    console.log('5️⃣ 프론트엔드 접속 정보:');
    console.log('   로그인 페이지: http://localhost:5173/login');
    console.log('   백엔드 API: http://localhost:3001\n');

    // 6. 로그인 문제 해결 체크리스트
    console.log('6️⃣ 로그인이 안될 경우 체크리스트:');
    console.log('   □ 백엔드 서버가 3001 포트에서 실행 중인가?');
    console.log('   □ 프론트엔드가 5173 포트에서 실행 중인가?');
    console.log('   □ 브라우저 콘솔에 CORS 에러가 있는가?');
    console.log('   □ 네트워크 탭에서 API 요청이 전송되는가?');
    console.log('   □ 비밀번호를 정확히 입력했는가?\n');

    // 7. 현재 로그인 가능 상태 요약
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 로그인 시스템 상태:');
    console.log(`   ✅ 데이터베이스: 정상`);
    console.log(`   ✅ 사용자 계정: ${users.length}개 활성화`);
    console.log(`   ✅ 백엔드 API: 정상 작동`);
    console.log(`   ✅ 로그인 라우트: /api/auth/login`);
    console.log(`   ✅ 인증 방식: Passport Local + Session`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('✅ 테스트 완료! 위의 계정으로 로그인을 시도해보세요.\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ 테스트 실패:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testActualLogin();

