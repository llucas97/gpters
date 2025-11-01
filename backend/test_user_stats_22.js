/**
 * userId 22의 최근 7일 활동 데이터 테스트 스크립트
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001';
const userId = 22;

async function testUserStats() {
  try {
    console.log(`\n=== userId ${userId} 통계 테스트 시작 ===\n`);
    
    // 1. Overview API 호출
    console.log('1. Overview API 호출 중...');
    const overviewResponse = await axios.get(`${API_BASE_URL}/api/user-stats/${userId}/overview`);
    
    if (overviewResponse.data.success) {
      console.log('✅ Overview API 성공');
      const stats = overviewResponse.data.stats;
      
      console.log('\n--- 전체 통계 ---');
      console.log('총 문제 수:', stats.totalProblems);
      console.log('정답 수:', stats.correctProblems);
      console.log('정확도:', stats.accuracy?.toFixed(2) + '%');
      console.log('평균 점수:', stats.averageScore);
      
      console.log('\n--- 최근 7일 활동 ---');
      if (stats.recentActivity) {
        console.log('기간:', stats.recentActivity.period);
        console.log('총 문제 수:', stats.recentActivity.totalProblems);
        console.log('정답 수:', stats.recentActivity.correctProblems);
        console.log('평균 점수:', stats.recentActivity.averageScore);
        console.log('\n✅ 최근 7일 활동 데이터:', JSON.stringify(stats.recentActivity, null, 2));
      } else {
        console.log('❌ recentActivity가 null 또는 undefined입니다.');
        console.log('stats 객체:', JSON.stringify(stats, null, 2));
      }
    } else {
      console.log('❌ Overview API 실패:', overviewResponse.data.error);
    }
    
  } catch (error) {
    console.error('\n❌ 테스트 중 오류 발생:');
    if (error.response) {
      console.error('HTTP 상태:', error.response.status);
      console.error('응답 데이터:', error.response.data);
    } else {
      console.error('오류 메시지:', error.message);
    }
  }
}

// 스크립트 실행
testUserStats();

