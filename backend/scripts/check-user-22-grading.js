const db = require('../models');

async function checkUser22Grading() {
  try {
    console.log('=== 유저 22의 최근 풀이 기록 확인 ===\n');
    
    const userId = '22';
    
    // 최근 레벨 2 문제 풀이 기록 조회 (최근 10개)
    const recentSessions = await db.StudySession.findAll({
      where: {
        user_id: userId,
        level: 2
      },
      order: [['finished_at', 'DESC']],
      limit: 10,
      attributes: [
        'id',
        'problem_id',
        'problem_title',
        'problem_type',
        'level',
        'is_correct',
        'score',
        'blanks_correct',
        'blanks_total',
        'accuracy',
        'user_answer',
        'grading_result',
        'finished_at'
      ]
    });
    
    console.log(`총 ${recentSessions.length}개의 레벨 2 풀이 기록을 찾았습니다.\n`);
    
    recentSessions.forEach((session, index) => {
      console.log(`\n--- 기록 ${index + 1} ---`);
      console.log(`ID: ${session.id}`);
      console.log(`문제 ID: ${session.problem_id}`);
      console.log(`문제 제목: ${session.problem_title}`);
      console.log(`문제 유형: ${session.problem_type}`);
      console.log(`레벨: ${session.level}`);
      console.log(`정답 여부: ${session.is_correct}`);
      console.log(`점수: ${session.score}`);
      console.log(`정답 수: ${session.blanks_correct}/${session.blanks_total}`);
      console.log(`정확도: ${session.accuracy}%`);
      console.log(`완료 시간: ${session.finished_at}`);
      
      // 사용자 답안 확인
      if (session.user_answer) {
        console.log(`사용자 답안:`, JSON.stringify(session.user_answer, null, 2));
      }
      
      // 채점 결과 상세 확인
      if (session.grading_result) {
        const gradingResult = typeof session.grading_result === 'string' 
          ? JSON.parse(session.grading_result)
          : session.grading_result;
        
        console.log(`채점 결과 상세:`);
        if (gradingResult.results && Array.isArray(gradingResult.results)) {
          gradingResult.results.forEach((result, idx) => {
            console.log(`  빈칸 ${result.blankId || idx + 1}:`);
            console.log(`    사용자 답안: "${result.userAnswer}"`);
            console.log(`    정답: "${result.correctAnswer}"`);
            console.log(`    정답 여부: ${result.isCorrect ? '✓' : '✗'}`);
          });
        }
        
        if (gradingResult.keywordsToBlank) {
          console.log(`정답 배열 (keywordsToBlank):`, gradingResult.keywordsToBlank);
        }
      }
    });
    
    // 통계 요약
    const correctCount = recentSessions.filter(s => s.is_correct === true).length;
    const incorrectCount = recentSessions.filter(s => s.is_correct === false).length;
    
    console.log(`\n\n=== 통계 요약 ===`);
    console.log(`총 풀이: ${recentSessions.length}개`);
    console.log(`정답: ${correctCount}개`);
    console.log(`오답: ${incorrectCount}개`);
    console.log(`정답률: ${recentSessions.length > 0 ? Math.round((correctCount / recentSessions.length) * 100) : 0}%`);
    
  } catch (error) {
    console.error('오류 발생:', error);
  } finally {
    await db.sequelize.close();
  }
}

checkUser22Grading();

