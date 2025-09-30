/**
 * 레벨 5 버그 수정하기 문제 생성 테스트
 */

const { generateBugFixProblem, validateBugFix } = require('./services/openaiDebugFix');

async function testBugFixGeneration() {
  console.log('=== 레벨 5 버그 수정하기 문제 생성 테스트 시작 ===\n');

  const testCases = [
    { level: 5, topic: 'arithmetic', language: 'javascript' },
    { level: 5, topic: 'loops', language: 'javascript' },
    { level: 5, topic: 'arrays', language: 'python' },
    { level: 5, topic: 'conditionals', language: 'python' }
  ];

  for (const testCase of testCases) {
    try {
      console.log(`\n--- 테스트 케이스: Level ${testCase.level}, ${testCase.topic}, ${testCase.language} ---`);
      
      const problem = await generateBugFixProblem(testCase);
      
      console.log('\n📝 생성된 문제:');
      console.log('제목:', problem.title);
      console.log('설명:', problem.description);
      console.log('지시사항:', problem.instruction);
      console.log('힌트:', problem.hint);
      console.log('예상 동작:', problem.expectedBehavior);
      
      console.log('\n💻 정답 코드:');
      console.log(problem.correctCode);
      
      console.log('\n🐞 버그가 있는 코드:');
      console.log(problem.buggyCode);
      
      console.log('\n🔍 버그 정보:');
      console.log('버그 라인 번호:', problem.buggyLineNumber);
      console.log('버그 설명:', problem.bugDescription);
      
      // 검증 테스트
      console.log('\n🧪 검증 테스트:');
      
      // 1. 정답 코드로 검증
      const correctValidation = validateBugFix(problem, problem.correctCode);
      console.log('정답 검증:', correctValidation.isCorrect ? '✅ 통과' : '❌ 실패');
      console.log('정답 점수:', correctValidation.score);
      console.log('정답 피드백:', correctValidation.feedback);
      
      // 2. 버그 코드로 검증 (수정하지 않은 경우)
      const buggyValidation = validateBugFix(problem, problem.buggyCode);
      console.log('버그코드 검증:', buggyValidation.isCorrect ? '❌ 잘못 통과' : '✅ 정상 실패');
      console.log('버그코드 점수:', buggyValidation.score);
      console.log('버그코드 피드백:', buggyValidation.feedback);
      
      // 3. 부분 수정된 코드로 검증
      const partiallyFixed = problem.buggyCode.replace(/\+/g, '-'); // 간단한 수정
      const partialValidation = validateBugFix(problem, partiallyFixed);
      console.log('부분수정 검증:', partialValidation.isCorrect ? '통과' : '실패');
      console.log('부분수정 점수:', partialValidation.score);
      console.log('부분수정 피드백:', partialValidation.feedback);
      
      // 기본 검증
      console.log('\n✅ 기본 검증:');
      console.log(`- 정답 코드 존재: ${problem.correctCode ? '✅' : '❌'}`);
      console.log(`- 버그 코드 존재: ${problem.buggyCode ? '✅' : '❌'}`);
      console.log(`- 버그 라인 번호: ${problem.buggyLineNumber > 0 ? '✅' : '❌'} (${problem.buggyLineNumber})`);
      console.log(`- 문제 타입: ${problem.type}`);
      console.log(`- 난이도: ${problem.difficulty}`);
      
      // 코드 차이점 확인
      const codesDifferent = problem.correctCode !== problem.buggyCode;
      console.log(`- 정답과 버그 코드 다름: ${codesDifferent ? '✅' : '❌'}`);
      
      // 버그 라인 존재 확인
      const buggyLines = problem.buggyCode.split('\n');
      const buggyLineExists = problem.buggyLineNumber <= buggyLines.length;
      console.log(`- 버그 라인 번호 유효: ${buggyLineExists ? '✅' : '❌'}`);
      
      if (buggyLineExists) {
        console.log(`- 버그 라인 내용: "${buggyLines[problem.buggyLineNumber - 1]?.trim()}"`);
      }
      
    } catch (error) {
      console.error(`❌ 테스트 실패:`, error.message);
      console.error('상세 오류:', error);
    }
    
    console.log('\n' + '='.repeat(60));
  }

  console.log('\n=== 테스트 완료 ===');
}

// 테스트 실행
if (require.main === module) {
  testBugFixGeneration().catch(console.error);
}

module.exports = { testBugFixGeneration };
