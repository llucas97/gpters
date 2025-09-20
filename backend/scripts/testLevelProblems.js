// backend/scripts/testLevelProblems.js
'use strict';

const app = require('../app');
const request = require('supertest');
const { stepToUserLevel, userLevelToStepRange } = require('../services/bojSteps');

async function testLevelProblems() {
  console.log('🎯 레벨별 문제 생성 테스트 시작\n');
  console.log('=' * 60);
  
  for (let level = 0; level <= 5; level++) {
    console.log(`\n📚 LEVEL ${level} 문제 생성 테스트`);
    console.log('-'.repeat(50));
    
    try {
      // Step 범위 확인
      const stepRange = userLevelToStepRange(level);
      console.log(`🔢 Step 범위: ${stepRange.start} ~ ${stepRange.end}`);
      
      // 해당 레벨의 중간 step으로 테스트
      const testStep = Math.floor((stepRange.start + stepRange.end) / 2);
      const calculatedLevel = stepToUserLevel(testStep);
      console.log(`🎲 테스트 Step: ${testStep} → Level: ${calculatedLevel}`);
      
      // BOJ API로 step 범위 확인
      const stepResponse = await request(app)
        .get(`/api/boj/step-range?level=${level}`);
      
      if (stepResponse.status === 200) {
        console.log(`✅ BOJ API Step 범위: ${stepResponse.body.range.start} ~ ${stepResponse.body.range.end}`);
      }
      
      // Quiz API로 문제 생성 시도
      console.log(`🔄 Level ${level} 문제 생성 중...`);
      
      const quizResponse = await request(app)
        .get(`/api/quiz/next?handle=test_level_${level}&lang=python`);
      
      if (quizResponse.status === 200) {
        const data = quizResponse.body;
        
        console.log(`✅ 문제 생성 성공!`);
        console.log(`👤 사용자: ${data.user.handle} (Tier: ${data.user.tier})`);
        console.log(`📋 문제 정보:`);
        console.log(`   • ID: ${data.problem.id}`);
        console.log(`   • 제목: ${data.problem.title}`);
        console.log(`   • 레벨: ${data.problem.level}`);
        console.log(`   • URL: ${data.problem.url}`);
        
        if (data.problem.description) {
          const shortDesc = data.problem.description.length > 100 
            ? data.problem.description.substring(0, 100) + '...' 
            : data.problem.description;
          console.log(`   • 설명: ${shortDesc}`);
        }
        
        if (data.problem.tags && data.problem.tags.length > 0) {
          console.log(`   • 태그: ${data.problem.tags.slice(0, 3).join(', ')}${data.problem.tags.length > 3 ? '...' : ''}`);
        }
        
        console.log(`🧩 빈칸 정보:`);
        console.log(`   • 빈칸 수: ${data.blankConfig.actual.blanks}`);
        console.log(`   • 깊이: ${data.blankConfig.actual.depth}`);
        
        if (data.blanks && data.blanks.length > 0) {
          console.log(`   • 첫 번째 빈칸 힌트: "${data.blanks[0].hint}"`);
        }
        
        // 코드 미리보기 (처음 3줄만)
        if (data.code) {
          const codeLines = data.code.split('\n').slice(0, 3);
          console.log(`💻 코드 미리보기:`);
          codeLines.forEach((line, index) => {
            console.log(`   ${index + 1}: ${line}`);
          });
          if (data.code.split('\n').length > 3) {
            console.log(`   ... (총 ${data.code.split('\n').length}줄)`);
          }
        }
        
      } else {
        console.log(`❌ 문제 생성 실패 (Status: ${quizResponse.status})`);
        if (quizResponse.body && quizResponse.body.error) {
          console.log(`   오류: ${quizResponse.body.error}`);
        }
      }
      
    } catch (error) {
      console.log(`❌ Level ${level} 테스트 중 오류 발생:`);
      console.log(`   ${error.message}`);
    }
    
    console.log(''); // 빈 줄 추가
  }
  
  console.log('=' * 60);
  console.log('🎉 레벨별 문제 생성 테스트 완료!\n');
}

// 스크립트 실행
if (require.main === module) {
  testLevelProblems()
    .then(() => {
      console.log('✅ 테스트 스크립트 완료');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ 테스트 스크립트 오류:', error);
      process.exit(1);
    });
}

module.exports = { testLevelProblems };
