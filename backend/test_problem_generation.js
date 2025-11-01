/**
 * OpenAI 기반 문제 생성 엔진 통합 테스트
 * 
 * 실행 방법:
 *   node test_problem_generation.js
 * 
 * 주의: 실제 OpenAI API 호출이 발생하므로 비용이 발생할 수 있습니다.
 */

'use strict';

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const { generateProblem } = require('./services/openaiProblemGen');
const { generateBlockCodingProblem } = require('./services/openaiBlockCoding');
const { validateProblem, detectProblemType, formatValidationResult } = require('./services/problemValidator');

// 테스트 결과 저장
const testResults = [];

// 테스트 헬퍼 함수
function logTest(name, result, details = '') {
  const status = result ? '✅ 성공' : '❌ 실패';
  console.log(`\n${status}: ${name}`);
  if (details) {
    console.log(`   상세: ${details}`);
  }
  testResults.push({ name, result, details });
}

// API 키 확인
function checkApiKey() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('\n❌ 오류: OPENAI_API_KEY 환경 변수가 설정되지 않았습니다.');
    console.error('   .env 파일에 OPENAI_API_KEY를 추가해주세요.\n');
    process.exit(1);
  }
  console.log('✅ OPENAI_API_KEY 확인됨\n');
}

// 레벨 0-5: Cloze 문제 테스트
async function testClozeProblems() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📝 Cloze 문제 (빈칸 채우기) 생성 테스트');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const levels = [0, 1, 3, 4, 5]; // 레벨 2는 블록코딩 전용
  
  for (const level of levels) {
    try {
      console.log(`\n[레벨 ${level}] 문제 생성 중...`);
      const problem = await generateProblem({
        level,
        topic: 'basic',
        language: 'javascript'
      });
      
      console.log(`   제목: ${problem.title}`);
      console.log(`   블랭크 개수: ${problem.blanks ? problem.blanks.length : 0}`);
      
      // 검증
      const problemType = detectProblemType(problem);
      const validation = validateProblem(problem, problemType);
      const result = formatValidationResult(validation, problemType);
      
      if (result.success) {
        logTest(`레벨 ${level} Cloze 문제 생성`, true, `블랭크: ${problem.blanks.length}개`);
      } else {
        logTest(`레벨 ${level} Cloze 문제 생성`, false, result.errors.join(', '));
        console.log('   검증 오류:', result.errors);
      }
      
      // 생성된 문제 일부 출력
      console.log(`\n   생성된 코드 샘플:`);
      console.log(problem.code.split('\n').slice(0, 5).map(line => `     ${line}`).join('\n'));
      
      // API 호출 간 대기 (Rate Limit 방지)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      logTest(`레벨 ${level} Cloze 문제 생성`, false, error.message);
      console.error('   오류:', error.message);
    }
  }
}

// 레벨 0-2: 블록 코딩 문제 테스트
async function testBlockCodingProblems() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🧩 블록 코딩 문제 생성 테스트');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const levels = [0, 1, 2];
  
  for (const level of levels) {
    try {
      console.log(`\n[레벨 ${level}] 블록 코딩 문제 생성 중...`);
      const problem = await generateBlockCodingProblem({
        level,
        topic: 'basic',
        language: 'javascript'
      });
      
      console.log(`   제목: ${problem.title}`);
      console.log(`   블록 개수: ${problem.blocks ? problem.blocks.length : 0}`);
      console.log(`   정답 블록: ${problem.blocks ? problem.blocks.filter(b => b.type === 'answer').length : 0}`);
      
      // 검증
      const problemType = detectProblemType(problem);
      const validation = validateProblem(problem, problemType);
      const result = formatValidationResult(validation, problemType);
      
      if (result.success) {
        logTest(`레벨 ${level} 블록 코딩 문제 생성`, true, `블록: ${problem.blocks.length}개`);
      } else {
        logTest(`레벨 ${level} 블록 코딩 문제 생성`, false, result.errors.join(', '));
        console.log('   검증 오류:', result.errors);
      }
      
      // API 호출 간 대기
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      logTest(`레벨 ${level} 블록 코딩 문제 생성`, false, error.message);
      console.error('   오류:', error.message);
    }
  }
}

// 레거시: 템플릿 코드 테스트 제거됨 (레벨 4-5가 Cloze 방식으로 통합됨)

// 메인 테스트 실행
async function runAllTests() {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║   OpenAI 기반 문제 생성 엔진 통합 테스트                ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  
  // API 키 확인
  checkApiKey();
  
  const startTime = Date.now();
  
  try {
    // 각 문제 유형별 테스트 실행
    await testClozeProblems();          // 레벨 0-1, 3-5 (빈칸 채우기)
    await testBlockCodingProblems();    // 레벨 0-2 (블록코딩 전용)
    
    // 최종 결과 출력
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 테스트 결과 요약');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const total = testResults.length;
    const passed = testResults.filter(r => r.result).length;
    const failed = total - passed;
    
    console.log(`\n총 테스트: ${total}개`);
    console.log(`✅ 성공: ${passed}개`);
    console.log(`❌ 실패: ${failed}개`);
    console.log(`성공률: ${((passed / total) * 100).toFixed(1)}%`);
    
    // 실패한 테스트 목록 출력
    if (failed > 0) {
      console.log('\n실패한 테스트:');
      testResults.filter(r => !r.result).forEach((test, i) => {
        console.log(`  ${i + 1}. ${test.name}`);
        console.log(`     사유: ${test.details}`);
      });
    }
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n⏱️  총 소요 시간: ${duration}초`);
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // 종료 코드 반환 (실패가 있으면 1)
    process.exit(failed > 0 ? 1 : 0);
    
  } catch (error) {
    console.error('\n❌ 테스트 실행 중 예상치 못한 오류 발생:', error);
    process.exit(1);
  }
}

// 테스트 실행
runAllTests();

