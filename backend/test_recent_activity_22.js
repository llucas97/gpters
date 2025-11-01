/**
 * userId 22의 최근 7일 활동 데이터 실제 확인 스크립트
 */

const { StudySession } = require('./models');
const { Op } = require('sequelize');

async function testRecentActivity() {
  try {
    const userId = '22'; // 문자열로 변환
    const days = 7;
    
    console.log(`\n=== userId ${userId} 최근 ${days}일 활동 실제 데이터 확인 ===\n`);
    
    // 오늘 날짜의 마지막 시간까지 포함
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    
    // 7일 전 자정부터 시작
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);
    
    console.log('날짜 범위:');
    console.log('  시작:', startDate.toISOString());
    console.log('  종료:', endDate.toISOString());
    console.log('');
    
    // 1. started_at 기준 조회
    console.log('1. started_at 기준 조회:');
    const byStartedAt = await StudySession.findAndCountAll({
      where: {
        user_id: userId,
        started_at: {
          [Op.gte]: startDate,
          [Op.lte]: endDate
        }
      }
    });
    console.log(`   총 개수: ${byStartedAt.count}`);
    console.log(`   레코드: ${byStartedAt.rows.length}개`);
    
    // 2. created_at 기준 조회 (혹시 모르니)
    console.log('\n2. created_at 기준 조회 (테이블에 created_at이 있다면):');
    try {
      const byCreatedAt = await StudySession.findAndCountAll({
        where: {
          user_id: userId,
          // created_at이 있다면 확인
        }
      });
      console.log(`   총 개수: ${byCreatedAt.count}`);
    } catch (err) {
      console.log('   created_at 필드 없음');
    }
    
    // 3. 전체 데이터 확인
    console.log('\n3. userId로 모든 데이터 조회 (날짜 필터 없이):');
    const allData = await StudySession.findAndCountAll({
      where: {
        user_id: userId
      },
      order: [['started_at', 'DESC']],
      limit: 10
    });
    console.log(`   전체 개수: ${allData.count}`);
    console.log(`   최근 10개 started_at:`, allData.rows.slice(0, 10).map(r => ({
      id: r.id,
      started_at: r.started_at,
      title: r.problem_title
    })));
    
    // 4. 최근 7일 데이터 상세 확인
    console.log('\n4. 최근 7일 데이터 상세:');
    if (byStartedAt.rows.length > 0) {
      byStartedAt.rows.forEach((row, idx) => {
        console.log(`   ${idx + 1}. ID: ${row.id}, started_at: ${row.started_at}, title: ${row.problem_title || 'N/A'}`);
      });
    } else {
      console.log('   최근 7일 데이터 없음');
      
      // 최근 데이터 확인
      const recent = await StudySession.findAll({
        where: { user_id: userId },
        order: [['started_at', 'DESC']],
        limit: 5
      });
      
      if (recent.length > 0) {
        console.log('\n   최근 데이터 (날짜 필터 없이):');
        recent.forEach((row, idx) => {
          const daysAgo = Math.floor((Date.now() - new Date(row.started_at).getTime()) / (1000 * 60 * 60 * 24));
          console.log(`   ${idx + 1}. ID: ${row.id}, started_at: ${row.started_at} (${daysAgo}일 전), title: ${row.problem_title || 'N/A'}`);
        });
      }
    }
    
  } catch (error) {
    console.error('\n❌ 오류:', error);
    console.error('스택:', error.stack);
  }
}

testRecentActivity();

