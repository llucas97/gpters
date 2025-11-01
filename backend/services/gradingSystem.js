'use strict';

const CodeValidator = require('./codeValidator');

/**
 * 통합 채점 시스템
 * 블록코딩과 빈칸채우기 문제의 답안을 채점
 */
class GradingSystem {
  
  /**
   * 블록코딩 문제 채점
   * @param {Object} problem - 문제 정보
   * @param {Object} userAnswer - 사용자 답안
   * @returns {Object} 채점 결과
   */
  static gradeBlockCoding(problem, userAnswer) {
    try {
      console.log('[GradingSystem] 블록코딩 채점 시작');
      console.log('[GradingSystem] 문제:', problem.title);
      console.log('[GradingSystem] 사용자 답안:', userAnswer);
      
      const { blankedCode, keywordsToBlank, completeCode } = problem;
      const { userBlocks } = userAnswer; // 사용자가 드래그한 블록들
      
      if (!userBlocks || !Array.isArray(userBlocks)) {
        return {
          success: false,
          error: '사용자 답안이 올바르지 않습니다',
          score: 0,
          isCorrect: false
        };
      }
      
      // 사용자 답안을 코드에 적용
      let userCode = blankedCode;
      let correctCount = 0;
      const totalBlanks = keywordsToBlank.length;
      const results = [];
      
      // 각 블랭크에 대해 사용자 답안 확인
      for (let i = 0; i < totalBlanks; i++) {
        const blankId = i + 1;
        const correctAnswer = keywordsToBlank[i];
        const userAnswer = userBlocks[i];
        
        if (!userAnswer) {
          results.push({
            blankId,
            correctAnswer,
            userAnswer: null,
            isCorrect: false,
            feedback: '답안이 없습니다'
          });
          continue;
        }
        
        const isCorrect = this.compareAnswers(correctAnswer, userAnswer);
        if (isCorrect) {
          correctCount++;
        }
        
        results.push({
          blankId,
          correctAnswer,
          userAnswer,
          isCorrect,
          feedback: isCorrect ? '정답입니다!' : `틀렸습니다. 정답은 "${correctAnswer}"입니다.`
        });
        
        // 코드에 사용자 답안 적용
        const placeholder = `BLANK_${blankId}`;
        userCode = userCode.replace(placeholder, userAnswer);
      }
      
      const score = Math.round((correctCount / totalBlanks) * 100);
      const isCorrect = correctCount === totalBlanks;
      
      // 생성된 코드가 올바른지 추가 검증
      let codeValidation = null;
      if (isCorrect) {
        try {
          // 간단한 문법 검사
          codeValidation = this.validateGeneratedCode(userCode);
        } catch (error) {
          console.warn('[GradingSystem] 코드 검증 실패:', error.message);
        }
      }
      
      console.log(`[GradingSystem] 채점 완료: ${correctCount}/${totalBlanks} (${score}점)`);
      
      return {
        success: true,
        score,
        isCorrect,
        correctCount,
        totalCount: totalBlanks,
        results,
        userCode,
        codeValidation,
        feedback: this.generateFeedback(score, results)
      };
      
    } catch (error) {
      console.error('[GradingSystem] 블록코딩 채점 오류:', error);
      return {
        success: false,
        error: error.message,
        score: 0,
        isCorrect: false
      };
    }
  }
  
  /**
   * 빈칸채우기 문제 채점
   * @param {Object} problem - 문제 정보
   * @param {Object} userAnswer - 사용자 답안
   * @returns {Object} 채점 결과
   */
  static gradeClozeTest(problem, userAnswer) {
    try {
      console.log('[GradingSystem] 빈칸채우기 채점 시작');
      console.log('[GradingSystem] 문제:', problem.title);
      console.log('[GradingSystem] 사용자 답안:', userAnswer);
      
      const { templateCode, solutions, blocks, keywordsToBlank } = problem;
      const { userAnswers } = userAnswer; // 사용자가 입력한 답안들
      
      if (!userAnswers || !Array.isArray(userAnswers)) {
        return {
          success: false,
          error: '사용자 답안이 올바르지 않습니다',
          score: 0,
          isCorrect: false
        };
      }
      
      // solutions 또는 blocks/keywordsToBlank 사용
      let correctAnswers;
      if (solutions && Array.isArray(solutions)) {
        correctAnswers = solutions.map(s => s.answer);
      } else if (blocks && Array.isArray(blocks)) {
        correctAnswers = blocks.filter(b => b.type === 'answer').map(b => b.text);
      } else if (keywordsToBlank && Array.isArray(keywordsToBlank)) {
        correctAnswers = keywordsToBlank;
      } else {
        return {
          success: false,
          error: '문제 정보가 올바르지 않습니다 (solutions, blocks, keywordsToBlank 중 하나 필요)',
          score: 0,
          isCorrect: false
        };
      }
      
      let correctCount = 0;
      const totalBlanks = correctAnswers.length;
      const results = [];
      
      // 각 빈칸에 대해 사용자 답안 확인
      for (let i = 0; i < totalBlanks; i++) {
        const correctAnswer = correctAnswers[i];
        const userAnswer = userAnswers[i];
        
        if (!userAnswer) {
          results.push({
            blankId: i + 1,
            correctAnswer: correctAnswer,
            userAnswer: null,
            isCorrect: false,
            feedback: '답안이 없습니다'
          });
          continue;
        }
        
        const isCorrect = this.compareAnswers(correctAnswer, userAnswer);
        if (isCorrect) {
          correctCount++;
        }
        
        results.push({
          blankId: i + 1,
          correctAnswer: correctAnswer,
          userAnswer,
          isCorrect,
          feedback: isCorrect ? '정답입니다!' : `틀렸습니다. 정답은 "${correctAnswer}"입니다.`
        });
      }
      
      const score = Math.round((correctCount / totalBlanks) * 100);
      const isCorrect = correctCount === totalBlanks;
      
      console.log(`[GradingSystem] 채점 완료: ${correctCount}/${totalBlanks} (${score}점)`);
      
      return {
        success: true,
        score,
        isCorrect,
        correctCount,
        totalCount: totalBlanks,
        results,
        feedback: this.generateFeedback(score, results)
      };
      
    } catch (error) {
      console.error('[GradingSystem] 빈칸채우기 채점 오류:', error);
      return {
        success: false,
        error: error.message,
        score: 0,
        isCorrect: false
      };
    }
  }
  
  /**
   * 답안 비교 (대소문자 무시, 공백 정규화)
   * @param {string} correct - 정답
   * @param {string} user - 사용자 답안
   * @returns {boolean} 일치 여부
   */
  static compareAnswers(correct, user) {
    if (!correct || !user) return false;
    
    // 대소문자 무시, 공백 정규화
    const normalize = (str) => String(str).trim().toLowerCase().replace(/\s+/g, ' ');
    return normalize(correct) === normalize(user);
  }
  
  /**
   * 생성된 코드 검증
   * @param {string} code - 검증할 코드
   * @returns {Object} 검증 결과
   */
  static validateGeneratedCode(code) {
    try {
      // JavaScript 문법 검사
      new Function(code);
      return {
        isValid: true,
        message: '코드가 올바르게 생성되었습니다'
      };
    } catch (error) {
      return {
        isValid: false,
        message: `코드 오류: ${error.message}`
      };
    }
  }
  
  /**
   * 피드백 생성
   * @param {number} score - 점수
   * @param {Array} results - 개별 결과들
   * @returns {string} 피드백 메시지
   */
  static generateFeedback(score, results) {
    if (score === 100) {
      return '🎉 완벽합니다! 모든 답이 정확합니다.';
    } else if (score >= 80) {
      return '👍 잘했습니다! 대부분의 답이 정확합니다.';
    } else if (score >= 60) {
      return '📚 조금 더 공부하면 완벽해질 수 있습니다.';
    } else {
      return '💪 다시 도전해보세요! 기본 개념을 다시 확인해보세요.';
    }
  }
  
  /**
   * 통합 채점 메인 함수
   * @param {string} problemType - 문제 유형 ('block' 또는 'cloze')
   * @param {Object} problem - 문제 정보
   * @param {Object} userAnswer - 사용자 답안
   * @returns {Object} 채점 결과
   */
  static grade(problemType, problem, userAnswer) {
    console.log(`[GradingSystem] 통합 채점 시작 - 유형: ${problemType}`);
    
    if (!problem || !userAnswer) {
      return {
        success: false,
        error: '문제 정보 또는 사용자 답안이 없습니다',
        score: 0,
        isCorrect: false
      };
    }
    
    switch (problemType.toLowerCase()) {
      case 'block':
      case 'blockcoding':
        return this.gradeBlockCoding(problem, userAnswer);
      
      case 'cloze':
      case 'clozetest':
        return this.gradeClozeTest(problem, userAnswer);
      
      default:
        return {
          success: false,
          error: `지원하지 않는 문제 유형: ${problemType}`,
          score: 0,
          isCorrect: false
        };
    }
  }
  
  /**
   * 레벨별 채점 기준 조정
   * @param {number} level - 레벨
   * @param {Object} gradingResult - 기본 채점 결과
   * @returns {Object} 조정된 채점 결과
   */
  static adjustGradingByLevel(level, gradingResult) {
    if (!gradingResult.success) return gradingResult;
    
    let adjustedScore = gradingResult.score;
    let adjustedFeedback = gradingResult.feedback;
    
    // 레벨별 보너스 점수
    if (level === 0 && gradingResult.isCorrect) {
      adjustedScore = Math.min(100, adjustedScore + 10); // 레벨 0 완벽 정답 시 보너스
      adjustedFeedback = '🌟 첫 번째 문제를 완벽하게 해결했습니다!';
    } else if (level === 1 && gradingResult.score >= 80) {
      adjustedScore = Math.min(100, adjustedScore + 5); // 레벨 1 고득점 시 보너스
    }
    
    return {
      ...gradingResult,
      score: adjustedScore,
      feedback: adjustedFeedback,
      levelBonus: adjustedScore > gradingResult.score
    };
  }
}

module.exports = GradingSystem;
