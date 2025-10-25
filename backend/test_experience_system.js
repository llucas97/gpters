/**
 * 경험치 시스템 테스트 스크립트
 * 지수 분배 알고리즘 및 레벨업 로직 검증
 */

const ExperienceSystem = require('./services/experienceSystem');

console.log('=== 경험치 시스템 테스트 ===\n');

// 1. 레벨별 최대 경험치 계산 테스트
console.log('1. 레벨별 최대 경험치 계산:');
for (let level = 1; level <= 10; level++) {
  const maxExp = ExperienceSystem.calculateMaxExperience(level);
  console.log(`레벨 ${level}: ${maxExp} 경험치`);
}
console.log();

// 2. 경험치로부터 레벨 계산 테스트
console.log('2. 경험치로부터 레벨 계산:');
const testExpValues = [0, 50, 100, 150, 200, 300, 500, 1000, 2000, 5000];
testExpValues.forEach(exp => {
  const levelInfo = ExperienceSystem.calculateLevelFromExperience(exp);
  console.log(`${exp} 경험치 → 레벨 ${levelInfo.level} (${levelInfo.currentLevelExp}/${levelInfo.expToNextLevel})`);
});
console.log();

// 3. 문제 해결 경험치 계산 테스트
console.log('3. 문제 해결 경험치 계산:');
const testProblems = [
  { level: 0, problemType: 'cloze', score: 100, isCorrect: true, isFirstAttempt: true, timeSpent: 60000 },
  { level: 1, problemType: 'block', score: 80, isCorrect: true, isFirstAttempt: false, timeSpent: 120000 },
  { level: 2, problemType: 'code_editor', score: 90, isCorrect: true, isFirstAttempt: true, timeSpent: 300000 },
  { level: 3, problemType: 'ordering', score: 70, isCorrect: false, isFirstAttempt: true, timeSpent: 180000 },
  { level: 4, problemType: 'bug_fix', score: 95, isCorrect: true, isFirstAttempt: true, timeSpent: 240000 }
];

testProblems.forEach((problem, index) => {
  const gainedExp = ExperienceSystem.calculateExperienceGain(problem);
  console.log(`문제 ${index + 1}: ${gainedExp} 경험치 (${problem.problemType}, 레벨 ${problem.level}, ${problem.score}점)`);
});
console.log();

// 4. 경험치 추가 및 레벨업 시뮬레이션
console.log('4. 경험치 추가 및 레벨업 시뮬레이션:');
let userData = { totalExperience: 0, level: 1 };
const problems = [
  { level: 0, problemType: 'cloze', score: 100, isCorrect: true, isFirstAttempt: true, timeSpent: 60000 },
  { level: 0, problemType: 'cloze', score: 100, isCorrect: true, isFirstAttempt: true, timeSpent: 60000 },
  { level: 0, problemType: 'cloze', score: 100, isCorrect: true, isFirstAttempt: true, timeSpent: 60000 },
  { level: 1, problemType: 'block', score: 90, isCorrect: true, isFirstAttempt: true, timeSpent: 120000 },
  { level: 1, problemType: 'block', score: 90, isCorrect: true, isFirstAttempt: true, timeSpent: 120000 }
];

problems.forEach((problem, index) => {
  const result = ExperienceSystem.addExperience(userData, problem);
  userData = result;
  
  console.log(`문제 ${index + 1} 해결 후:`);
  console.log(`  - 총 경험치: ${result.totalExperience}`);
  console.log(`  - 현재 레벨: ${result.level}`);
  console.log(`  - 레벨업: ${result.leveledUp ? 'YES' : 'NO'}`);
  console.log(`  - 획득 경험치: ${result.gainedExperience}`);
  console.log(`  - 다음 레벨까지: ${result.expToNextLevel} 경험치`);
  console.log();
});

// 5. 레벨업 보상 테스트
console.log('5. 레벨업 보상:');
for (let level = 1; level <= 10; level++) {
  const reward = ExperienceSystem.calculateLevelUpReward(level);
  console.log(`레벨 ${level} 보상: ${reward.title} (${reward.bonus} 경험치)`);
}

console.log('\n=== 테스트 완료 ===');
