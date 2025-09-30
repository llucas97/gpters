/**
 * 레벨 4 순서 맞추기 문제 생성 테스트
 */

const { generateCodeOrderingProblem, validateOrderingAnswer } = require('./services/openaiCodeOrdering');

async function testCodeOrderingGeneration() {
  console.log('=== 레벨 4 순서 맞추기 문제 생성 테스트 시작 ===\n');

  const testCases = [
    { level: 4, topic: 'sorting', language: 'javascript' },
    { level: 4, topic: 'loops', language: 'javascript' },
    { level: 4, topic: 'arrays', language: 'python' },
    { level: 4, topic: 'functions', language: 'python' }
  ];

  for (const testCase of testCases) {
    try {
      console.log(`\n--- 테스트 케이스: Level ${testCase.level}, ${testCase.topic}, ${testCase.language} ---`);
      
      const problem = await generateCodeOrderingProblem(testCase);
      
      console.log('\n📝 생성된 문제:');
      console.log('제목:', problem.title);
      console.log('설명:', problem.description);
      console.log('지시사항:', problem.instruction);
      console.log('설명:', problem.explanation);
      
      console.log('\n💻 정답 코드:');
      console.log(problem.correctCode);
      
      console.log('\n🔀 섞인 라인들:');
      problem.shuffledLines.forEach((line, index) => {
        console.log(`${index + 1}. ${line}`);
      });
      
      console.log('\n✅ 정답 순서:');
      problem.correctOrder.forEach((line, index) => {
        console.log(`${index + 1}. ${line}`);
      });
      
      // 검증 테스트
      console.log('\n🧪 검증 테스트:');
      
      // 1. 정답으로 검증
      const correctValidation = validateOrderingAnswer(problem, problem.correctOrder);
      console.log('정답 검증:', correctValidation.isCorrect ? '✅ 통과' : '❌ 실패');
      console.log('정답 점수:', correctValidation.score);
      
      // 2. 틀린 답으로 검증
      const wrongOrder = [...problem.shuffledLines]; // 섞인 순서 그대로
      const wrongValidation = validateOrderingAnswer(problem, wrongOrder);
      console.log('오답 검증:', wrongValidation.isCorrect ? '❌ 잘못 통과' : '✅ 정상 실패');
      console.log('오답 점수:', wrongValidation.score);
      
      // 3. 부분 정답 검증
      const partialOrder = [...problem.correctOrder];
      if (partialOrder.length > 1) {
        // 마지막 두 라인 순서 바꾸기
        [partialOrder[partialOrder.length - 1], partialOrder[partialOrder.length - 2]] = 
        [partialOrder[partialOrder.length - 2], partialOrder[partialOrder.length - 1]];
        
        const partialValidation = validateOrderingAnswer(problem, partialOrder);
        console.log('부분정답 검증:', partialValidation.isCorrect ? '❌ 잘못 통과' : '✅ 정상 실패');
        console.log('부분정답 점수:', partialValidation.score);
      }
      
      // 기본 검증
      console.log('\n✅ 기본 검증:');
      console.log(`- 섞인 라인 개수: ${problem.shuffledLines.length}개`);
      console.log(`- 정답 순서 개수: ${problem.correctOrder.length}개`);
      console.log(`- 라인 개수 일치: ${problem.shuffledLines.length === problem.correctOrder.length ? '✅' : '❌'}`);
      console.log(`- 총 라인 수: ${problem.totalLines}개`);
      console.log(`- 문제 타입: ${problem.type}`);
      console.log(`- 난이도: ${problem.difficulty}`);
      
      // 섞인 라인과 정답 라인이 같은 내용인지 확인 (순서만 다른지)
      const shuffledSorted = [...problem.shuffledLines].sort();
      const correctSorted = [...problem.correctOrder].sort();
      const sameContent = JSON.stringify(shuffledSorted) === JSON.stringify(correctSorted);
      console.log(`- 동일한 라인들 (순서만 다름): ${sameContent ? '✅' : '❌'}`);
      
    } catch (error) {
      console.error(`❌ 테스트 실패:`, error.message);
    }
    
    console.log('\n' + '='.repeat(60));
  }

  console.log('\n=== 테스트 완료 ===');
}

// 테스트 실행
if (require.main === module) {
  testCodeOrderingGeneration().catch(console.error);
}

module.exports = { testCodeOrderingGeneration };
