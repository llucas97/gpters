/**
 * UserExperience 테이블의 레벨 데이터를 확인하고
 * users 테이블의 current_level과 experience_points를 업데이트하는 스크립트
 */

require('dotenv').config();
const { User, UserExperience } = require('../models');

async function syncUserLevels() {
  try {
    console.log('\n=== 유저 레벨 데이터 동기화 시작 ===\n');
    
    // UserExperience 테이블에서 모든 유저 데이터 조회
    const allUserExperiences = await UserExperience.findAll({
      order: [['user_id', 'ASC']]
    });
    
    console.log(`총 ${allUserExperiences.length}개의 UserExperience 레코드 발견\n`);
    
    if (allUserExperiences.length === 0) {
      console.log('업데이트할 데이터가 없습니다.');
      return;
    }
    
    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    for (const userExp of allUserExperiences) {
      try {
        const userId = userExp.user_id;
        const experienceSystemLevel = userExp.level || 1;
        const totalExperience = userExp.totalExperience || 0;
        
        // ExperienceSystem의 레벨(1부터)을 users 테이블의 current_level(0-5)로 변환
        // ExperienceSystem level 1 = users current_level 0
        // ExperienceSystem level 2 = users current_level 1
        // ...
        // ExperienceSystem level 6 = users current_level 5
        const usersTableLevel = Math.max(0, Math.min(5, experienceSystemLevel - 1));
        
        // 해당 유저가 존재하는지 확인
        const user = await User.findByPk(userId);
        
        if (!user) {
          console.log(`⚠️  사용자 ID ${userId}: users 테이블에 존재하지 않음 - 건너뜀`);
          skippedCount++;
          continue;
        }
        
        // 현재 users 테이블의 레벨과 경험치
        const currentUserLevel = user.current_level;
        const currentUserExp = user.experience_points;
        
        // 업데이트가 필요한지 확인
        const needsUpdate = 
          currentUserLevel !== usersTableLevel || 
          currentUserExp !== totalExperience;
        
        if (needsUpdate) {
          await User.update(
            {
              current_level: usersTableLevel,
              experience_points: totalExperience,
              updated_at: new Date()
            },
            {
              where: { user_id: userId }
            }
          );
          
          console.log(`✅ 사용자 ID ${userId} 업데이트:`);
          console.log(`   레벨: ${currentUserLevel} → ${usersTableLevel} (ExperienceSystem: ${experienceSystemLevel})`);
          console.log(`   경험치: ${currentUserExp} → ${totalExperience}`);
          updatedCount++;
        } else {
          console.log(`⏭️  사용자 ID ${userId}: 이미 동기화됨 (레벨: ${usersTableLevel}, 경험치: ${totalExperience})`);
          skippedCount++;
        }
        
      } catch (error) {
        console.error(`❌ 사용자 ID ${userExp.user_id} 업데이트 오류:`, error.message);
        errorCount++;
      }
    }
    
    console.log('\n=== 동기화 완료 ===');
    console.log(`업데이트됨: ${updatedCount}개`);
    console.log(`건너뜀: ${skippedCount}개`);
    console.log(`오류: ${errorCount}개`);
    console.log(`총 처리: ${allUserExperiences.length}개\n`);
    
    // UserExperience가 없는 users 확인
    const allUsers = await User.findAll({
      attributes: ['user_id', 'username', 'current_level', 'experience_points']
    });
    
    const usersWithExp = new Set(allUserExperiences.map(ue => ue.user_id));
    const usersWithoutExp = allUsers.filter(u => !usersWithExp.has(u.user_id));
    
    if (usersWithoutExp.length > 0) {
      console.log(`\n⚠️  UserExperience가 없는 사용자 ${usersWithoutExp.length}명:`);
      usersWithoutExp.forEach(u => {
        console.log(`   - ID: ${u.user_id}, Username: ${u.username}, Level: ${u.current_level}`);
      });
    }
    
  } catch (error) {
    console.error('\n❌ 동기화 오류:', error);
    console.error('스택:', error.stack);
    process.exit(1);
  }
}

// 스크립트 실행
syncUserLevels()
  .then(() => {
    console.log('\n✅ 스크립트 완료');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ 스크립트 실패:', error);
    process.exit(1);
  });

