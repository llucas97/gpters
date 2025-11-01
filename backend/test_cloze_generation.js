/**
 * 빈칸채우기 문제 생성 테스트
 */

const { generateProblem } = require('./services/openaiProblemGen');

async function testClozeGeneration() {
  console.log('=== 빈칸채우기 문제 생성 테스트 시작 ===\n');

  const testCases = [
    { level: 2, topic: 'basic', language: 'javascript', problemType: 'cloze' },
    { level: 3, topic: 'arithmetic', language: 'javascript', problemType: 'cloze' },
    { level: 2, topic: 'basic', language: 'python', problemType: 'cloze' },
    { level: 3, topic: 'loops', language: 'python', problemType: 'cloze' }
  ];

  for (const testCase of testCases) {
    try {
      console.log(`\n--- 테스트 케이스: Level ${testCase.level}, ${testCase.topic}, ${testCase.language} ---`);
      
      const problem = await generateProblem(testCase);
      
      console.log('\n📝 생성된 문제:');
      console.log('제목:', problem.title);
      console.log('설명:', problem.statement);
      console.log('레벨:', problem.level);
      console.log('언어:', problem.language);
      
      console.log('\n💻 코드 템플릿:');
      console.log(problem.code);
      
      console.log('\n🔲 빈칸들:');
      problem.blanks.forEach((blank, index) => {
        console.log(`${index + 1}. ID: ${blank.id}, 답: ${blank.answer}, 힌트: ${blank.hint}`);
      });
      
      // 검증
      console.log('\n✅ 검증 결과:');
      console.log(`- 빈칸 개수: ${problem.blanks.length}개`);
      console.log(`- 코드에 플레이스홀더 포함: ${problem.code.includes('__') ? '✅' : '❌'}`);
      console.log(`- 빈칸과 플레이스홀더 개수 일치: ${problem.blanks.length === (problem.code.match(/__\d+__/g) || []).length ? '✅' : '❌'}`);
      
      // 레벨별 빈칸 개수 확인
      if (testCase.level === 2) {
        const expectedBlanks = 1;
        const blankCount = problem.blanks.length;
        const isCorrect = blankCount === expectedBlanks;
        console.log(`- 레벨 2 정확한 빈칸 개수 (${expectedBlanks}개): ${isCorrect ? '✅' : '❌'} (${blankCount}개)`);
      } else if (testCase.level === 3) {
        const expectedBlanks = 2;
        const blankCount = problem.blanks.length;
        const isCorrect = blankCount === expectedBlanks;
        console.log(`- 레벨 3 정확한 빈칸 개수 (${expectedBlanks}개): ${isCorrect ? '✅' : '❌'} (${blankCount}개)`);
      }
      
    } catch (error) {
      console.error(`❌ 테스트 실패:`, error.message);
    }
    
    console.log('\n' + '='.repeat(60));
  }

  console.log('\n=== 테스트 완료 ===');
}

// 테스트 실행
if (require.main === module) {
  testClozeGeneration().catch(console.error);
}

module.exports = { testClozeGeneration };
