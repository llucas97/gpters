/**
 * 문제 평가 및 신고 시스템 테스트
 * 
 * 실행 방법:
 * node backend/test_problem_evaluation.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

// 테스트 데이터
const testData = {
  userId: 1,
  problemId: 1,
  rating: 4,
  feedback: '좋은 문제였습니다. 설명이 명확했어요.',
  reportReason: '테스트용 신고: 문제에 오타가 있습니다.'
};

async function testProblemEvaluation() {
  console.log('🧪 문제 평가 및 신고 시스템 테스트 시작\n');
  
  try {
    // 1. 평가 제출 테스트
    console.log('1️⃣ 평가 제출 테스트');
    console.log('요청 데이터:', {
      userId: testData.userId,
      problemId: testData.problemId,
      rating: testData.rating,
      feedback: testData.feedback
    });
    
    const rateResponse = await axios.post(`${BASE_URL}/api/problem-evaluation/rate`, {
      userId: testData.userId,
      problemId: testData.problemId,
      rating: testData.rating,
      feedback: testData.feedback
    });
    
    console.log('✅ 평가 제출 성공:', rateResponse.data);
    console.log('');
    
    // 2. 평가 업데이트 테스트 (같은 사용자, 같은 문제)
    console.log('2️⃣ 평가 업데이트 테스트 (같은 사용자, 같은 문제)');
    const updateRating = 5;
    const updateFeedback = '업데이트된 피드백: 정말 훌륭한 문제입니다!';
    
    const updateResponse = await axios.post(`${BASE_URL}/api/problem-evaluation/rate`, {
      userId: testData.userId,
      problemId: testData.problemId,
      rating: updateRating,
      feedback: updateFeedback
    });
    
    console.log('✅ 평가 업데이트 성공:', updateResponse.data);
    console.log('');
    
    // 3. 신고 제출 테스트
    console.log('3️⃣ 신고 제출 테스트');
    console.log('요청 데이터:', {
      userId: testData.userId,
      problemId: testData.problemId,
      reportReason: testData.reportReason
    });
    
    const reportResponse = await axios.post(`${BASE_URL}/api/problem-evaluation/report`, {
      userId: testData.userId,
      problemId: testData.problemId,
      reportReason: testData.reportReason
    });
    
    console.log('✅ 신고 제출 성공:', reportResponse.data);
    console.log('');
    
    // 4. 평가 통계 조회 테스트
    console.log('4️⃣ 평가 통계 조회 테스트');
    const statsResponse = await axios.get(`${BASE_URL}/api/problem-evaluation/${testData.problemId}/stats`);
    
    console.log('✅ 평가 통계 조회 성공:', statsResponse.data);
    console.log('');
    
    // 5. 유효성 검사 테스트
    console.log('5️⃣ 유효성 검사 테스트');
    
    // 5-1. 잘못된 평가 점수 (범위 초과)
    try {
      await axios.post(`${BASE_URL}/api/problem-evaluation/rate`, {
        userId: testData.userId,
        problemId: testData.problemId,
        rating: 10 // 잘못된 점수 (1-5 범위 초과)
      });
      console.log('❌ 유효성 검사 실패: 잘못된 평가 점수가 허용됨');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ 유효성 검사 성공: 잘못된 평가 점수 차단됨');
        console.log('   에러 메시지:', error.response.data.error);
      }
    }
    
    // 5-2. 신고 사유 없음
    try {
      await axios.post(`${BASE_URL}/api/problem-evaluation/report`, {
        userId: testData.userId,
        problemId: testData.problemId
        // reportReason 없음
      });
      console.log('❌ 유효성 검사 실패: 신고 사유 없이 제출 허용됨');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ 유효성 검사 성공: 신고 사유 없는 제출 차단됨');
        console.log('   에러 메시지:', error.response.data.error);
      }
    }
    
    console.log('\n🎉 모든 테스트 완료!');
    
  } catch (error) {
    console.error('❌ 테스트 실패:', error.message);
    if (error.response) {
      console.error('응답 데이터:', error.response.data);
    }
    process.exit(1);
  }
}

// 서버 연결 확인 후 테스트 실행
async function checkServerAndRunTests() {
  try {
    console.log('서버 연결 확인 중...');
    await axios.get(`${BASE_URL}/api/test`);
    console.log('✅ 서버 연결 성공\n');
    await testProblemEvaluation();
  } catch (error) {
    console.error('❌ 서버에 연결할 수 없습니다.');
    console.error('백엔드 서버가 실행 중인지 확인하세요: npm start (backend 디렉토리)');
    process.exit(1);
  }
}

// 테스트 실행
checkServerAndRunTests();

