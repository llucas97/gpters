// 로그인 프로세스 테스트 스크립트
require('dotenv').config({ path: '../.env' });
const db = require('./models');
const bcrypt = require('bcryptjs');

async function testLoginFlow() {
  try {
    console.log('🧪 로그인 프로세스 테스트 시작...\n');

    // 1. 데이터베이스 연결 확인
    console.log('1️⃣ 데이터베이스 연결 확인...');
    await db.sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공!\n');

    // 2. users 테이블 존재 확인
    console.log('2️⃣ users 테이블 확인...');
    const users = await db.User.findAll({ limit: 5 });
    console.log(`✅ users 테이블 존재 (총 ${users.length}명 조회됨)\n`);

    if (users.length === 0) {
      console.log('⚠️ 사용자가 없습니다. 테스트 계정을 생성하세요.\n');
      process.exit(0);
    }

    // 3. 각 사용자 상태 확인
    console.log('3️⃣ 사용자 상태 확인...');
    console.log('┌─────────────────────────────────────────────────────────────────────┐');
    console.log('│ ID │ Email              │ Provider │ Level │ Active │ Has Password  │');
    console.log('├─────────────────────────────────────────────────────────────────────┤');
    
    for (const user of users) {
      const hasPassword = user.password_hash ? '✅' : '❌';
      const isActive = user.is_active ? '✅' : '❌';
      console.log(`│ ${String(user.user_id).padEnd(3)} │ ${user.email.padEnd(18)} │ ${user.provider.padEnd(8)} │ ${String(user.current_level).padEnd(5)} │ ${isActive.padEnd(6)} │ ${hasPassword.padEnd(13)} │`);
    }
    console.log('└─────────────────────────────────────────────────────────────────────┘\n');

    // 4. 로그인 가능 여부 체크
    console.log('4️⃣ 로그인 가능 여부 체크...');
    const loginableUsers = users.filter(u => 
      u.is_active && 
      u.password_hash && 
      u.provider === 'local'
    );
    
    console.log(`✅ 로그인 가능한 사용자: ${loginableUsers.length}명`);
    
    if (loginableUsers.length > 0) {
      console.log('\n📋 로그인 가능한 계정:');
      loginableUsers.forEach(u => {
        console.log(`   - ${u.email} (${u.username})`);
      });
    } else {
      console.log('❌ 로그인 가능한 계정이 없습니다!\n');
      console.log('💡 해결 방법:');
      console.log('   1. fix_login_db.sql 쿼리 실행');
      console.log('   2. 또는 새로 회원가입\n');
    }

    // 5. 비밀번호 검증 테스트 (첫 번째 로그인 가능 사용자)
    if (loginableUsers.length > 0) {
      console.log('\n5️⃣ 비밀번호 검증 테스트...');
      const testUser = loginableUsers[0];
      console.log(`   테스트 사용자: ${testUser.email}`);
      
      // 비밀번호 해시 샘플 확인
      const hashSample = testUser.password_hash.substring(0, 20) + '...';
      console.log(`   비밀번호 해시: ${hashSample}`);
      console.log('   ℹ️ 실제 비밀번호로 로그인 테스트해보세요!\n');
    }

    // 6. 문제가 있는 사용자 리스트
    const problemUsers = users.filter(u => 
      !u.is_active || 
      !u.password_hash || 
      u.provider !== 'local'
    );
    
    if (problemUsers.length > 0) {
      console.log('\n⚠️ 문제가 있는 사용자:');
      console.log('┌───────────────────────────────────────────────────┐');
      problemUsers.forEach(u => {
        const issues = [];
        if (!u.is_active) issues.push('비활성화');
        if (!u.password_hash) issues.push('비밀번호 없음');
        if (u.provider !== 'local') issues.push(`provider: ${u.provider}`);
        console.log(`│ ${u.email.padEnd(25)} │ ${issues.join(', ').padEnd(20)} │`);
      });
      console.log('└───────────────────────────────────────────────────┘\n');
      console.log('💡 fix_login_db.sql 실행으로 해결 가능합니다.\n');
    }

    console.log('✅ 테스트 완료!');
    process.exit(0);

  } catch (error) {
    console.error('❌ 테스트 실패:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testLoginFlow();

