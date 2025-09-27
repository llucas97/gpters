/**
 * 블록코딩 문제 생성 로직 테스트 파일
 */

const { generateBlockCodingProblem } = require('./services/openaiBlockCoding');

async function testBlockCodingGeneration() {
  console.log('=== 블록코딩 문제 생성 테스트 시작 ===\n');

  const testCases = [
    { level: 0, topic: 'basic', language: 'javascript' },
    { level: 1, topic: 'arithmetic', language: 'javascript' },
    { level: 0, topic: 'basic', language: 'python' },
    { level: 1, topic: 'loops', language: 'python' }
  ];

  for (const testCase of testCases) {
    try {
      console.log(`\n--- 테스트 케이스: Level ${testCase.level}, ${testCase.topic}, ${testCase.language} ---`);
      
      const result = await generateBlockCodingProblem(testCase);
      
      console.log('\n📝 생성된 문제:');
      console.log('제목:', result.title);
      console.log('설명:', result.description);
      console.log('지시사항:', result.instruction);
      
      console.log('\n💻 정답 코드:');
      console.log(result.completeCode);
      
      console.log('\n🔲 블랭크 코드:');
      console.log(result.blankedCode);
      
      console.log('\n🧩 선택된 키워드:', result.keywordsToBlank);
      console.log('🔢 블랭크 개수:', result.blankCount);
      
      console.log('\n🎯 블록들:');
      result.blocks.forEach((block, index) => {
        console.log(`${index + 1}. [${block.type}] ${block.text} (ID: ${block.id})`);
      });
      
      // 검증
      console.log('\n✅ 검증 결과:');
      const expectedBlankCount = testCase.level === 0 ? 1 : (testCase.level === 1 ? 2 : result.blankCount);
      const blankCountCorrect = result.blankCount === expectedBlankCount;
      console.log(`- 레벨 ${testCase.level}에 맞는 블랭크 개수: ${blankCountCorrect ? '✅' : '❌'} (예상: ${expectedBlankCount}, 실제: ${result.blankCount})`);
      
      // 선택된 키워드 개수와 블랭크 개수 일치 확인
      const keywordCountMatch = result.keywordsToBlank.length === result.blankCount;
      console.log(`- 키워드 개수와 블랭크 개수 일치: ${keywordCountMatch ? '✅' : '❌'} (키워드: ${result.keywordsToBlank.length}, 블랭크: ${result.blankCount})`);
      
      console.log(`- 정답 블록 개수: ${result.blocks.filter(b => b.type === 'answer').length}개`);
      console.log(`- 오답 블록 개수: ${result.blocks.filter(b => b.type === 'distractor').length}개`);
      console.log(`- 총 블록 개수: ${result.blocks.length}개`);
      
      // 블랭크 코드에 BLANK_1, BLANK_2가 포함되어 있는지 확인
      const hasBlanks = result.blankedCode.includes('BLANK_1') || result.blankedCode.includes('BLANK_2');
      console.log(`- 블랭크 코드에 BLANK_* 포함: ${hasBlanks ? '✅' : '❌'}`);
      
      // 레벨별 엄격한 검증
      if (testCase.level === 0) {
        const hasExactlyOneBlank = (result.blankedCode.match(/BLANK_\d+/g) || []).length === 1;
        console.log(`- 레벨 0: 정확히 1개 블랭크: ${hasExactlyOneBlank ? '✅' : '❌'}`);
      } else if (testCase.level === 1) {
        const hasExactlyTwoBlanks = (result.blankedCode.match(/BLANK_\d+/g) || []).length === 2;
        console.log(`- 레벨 1: 정확히 2개 블랭크: ${hasExactlyTwoBlanks ? '✅' : '❌'}`);
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
  testBlockCodingGeneration().catch(console.error);
}

module.exports = { testBlockCodingGeneration };
