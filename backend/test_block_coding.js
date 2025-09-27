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
      console.log(`- 레벨 ${testCase.level}에 맞는 블랭크 개수: ${result.blankCount === (testCase.level === 0 ? 1 : 2) ? '✅' : '❌'}`);
      console.log(`- 정답 블록 개수: ${result.blocks.filter(b => b.type === 'answer').length}개`);
      console.log(`- 오답 블록 개수: ${result.blocks.filter(b => b.type === 'distractor').length}개`);
      console.log(`- 총 블록 개수: ${result.blocks.length}개`);
      
      // 블랭크 코드에 BLANK_1, BLANK_2가 포함되어 있는지 확인
      const hasBlanks = result.blankedCode.includes('BLANK_1') || result.blankedCode.includes('BLANK_2');
      console.log(`- 블랭크 코드에 BLANK_* 포함: ${hasBlanks ? '✅' : '❌'}`);
      
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
