const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const db = require('./models');

async function checkDatabaseStatus() {
  try {
    console.log('🔍 데이터베이스 연결 확인...\n');
    await db.sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공\n');
    
    // 1. user_experience 테이블 존재 확인
    console.log('📋 user_experience 테이블 확인...');
    const [tables] = await db.sequelize.query(
      "SHOW TABLES LIKE 'user_experience'"
    );
    
    if (tables.length === 0) {
      console.log('❌ user_experience 테이블이 존재하지 않습니다!\n');
      return;
    }
    console.log('✅ user_experience 테이블 존재\n');
    
    // 2. 테이블 구조 확인
    console.log('📋 테이블 구조:');
    const [structure] = await db.sequelize.query('DESCRIBE user_experience');
    console.table(structure.map(col => ({
      필드: col.Field,
      타입: col.Type,
      Null: col.Null,
      Key: col.Key,
      기본값: col.Default
    })));
    
    // 3. users 테이블 확인
    console.log('\n📋 users 테이블 정보:');
    const [users] = await db.sequelize.query(
      'SELECT user_id, username, email FROM users LIMIT 5'
    );
    console.table(users);
    
    // 4. user_experience 데이터 확인
    console.log('\n📋 user_experience 데이터:');
    const [experiences] = await db.sequelize.query(
      'SELECT * FROM user_experience'
    );
    console.table(experiences);
    
    // 5. Foreign Key 확인
    console.log('\n📋 Foreign Key 관계 확인:');
    const [fks] = await db.sequelize.query(`
      SELECT 
        CONSTRAINT_NAME,
        TABLE_NAME,
        COLUMN_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
      FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_NAME = 'user_experience'
        AND REFERENCED_TABLE_NAME IS NOT NULL
    `);
    console.table(fks);
    
    // 6. 사용자 ID 22의 경험치 조회 테스트
    console.log('\n🧪 사용자 ID 22 경험치 조회 테스트:');
    const userExp = await db.UserExperience.findOne({
      where: { user_id: 22 },
      include: [{
        model: db.User,
        as: 'user',
        attributes: ['user_id', 'username', 'email']
      }]
    });
    
    if (userExp) {
      console.log('✅ 조회 성공:');
      console.log(JSON.stringify(userExp.toJSON(), null, 2));
    } else {
      console.log('❌ 데이터 없음');
    }
    
    console.log('\n✅ 모든 확인 완료!');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ 오류 발생:');
    console.error('에러 메시지:', error.message);
    console.error('에러 상세:', error);
    process.exit(1);
  }
}

checkDatabaseStatus();

