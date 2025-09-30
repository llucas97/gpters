// backend/test_level4_template.js
const { generateProblem } = require('./services/openaiProblemGen');

async function testLevel4Template() {
  console.log('=== 레벨 4 템플릿 코드 생성 테스트 ===\n');
  
  const testCases = [
    { level: 4, topic: 'arrays', language: 'javascript' },
    { level: 5, topic: 'loops', language: 'javascript' }
  ];
  
  for (const testCase of testCases) {
    try {
      console.log(`\n🔍 테스트 중: 레벨 ${testCase.level}, 주제: ${testCase.topic}, 언어: ${testCase.language}`);
      
      const problem = await generateProblem({
        level: testCase.level,
        topic: testCase.topic,
        language: testCase.language,
        recentTitles: []
      });
      
      console.log('\n✅ 생성된 문제:');
      console.log(`- 제목: ${problem.title}`);
      console.log(`- 설명: ${problem.description?.substring(0, 100)}...`);
      
      // 템플릿 코드 확인
      if (problem.templateCode) {
        console.log('\n📝 템플릿 코드:');
        console.log(problem.templateCode);
      } else if (problem.code_template) {
        console.log('\n📝 코드 템플릿:');
        console.log(problem.code_template);
      }
      
      // 테스트 케이스 확인
      if (problem.testCases && problem.testCases.length > 0) {
        console.log('\n🧪 테스트 케이스:');
        problem.testCases.forEach((tc, index) => {
          console.log(`  ${index + 1}. 입력: ${JSON.stringify(tc.input)}, 예상 출력: ${JSON.stringify(tc.expected_output)}`);
        });
      }
      
      // 블랭크 확인
      if (problem.blanks && problem.blanks.length > 0) {
        console.log('\n📝 블랭크:');
        problem.blanks.forEach(blank => {
          console.log(`  - ID: ${blank.id}, 답: ${blank.answer}, 힌트: ${blank.hint}`);
        });
      }
      
      console.log('\n' + '='.repeat(50));
      
    } catch (error) {
      console.error(`❌ 테스트 실패: ${error.message}`);
      console.error(error.stack);
    }
  }
}

// API 키가 있을 때만 실행
if (process.env.OPENAI_API_KEY) {
  testLevel4Template().then(() => {
    console.log('\n✅ 모든 테스트 완료');
    process.exit(0);
  }).catch(error => {
    console.error('❌ 테스트 실행 오류:', error);
    process.exit(1);
  });
} else {
  console.log('❌ OPENAI_API_KEY가 설정되지 않았습니다.');
  process.exit(1);
}
