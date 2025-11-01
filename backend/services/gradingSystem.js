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
      console.log('[GradingSystem] 문제 정보:', {
        hasBlankedCode: !!problem.blankedCode,
        hasKeywordsToBlank: !!problem.keywordsToBlank,
        keywordsToBlank: problem.keywordsToBlank,
        hasBlankMappings: !!problem.blankMappings,
        blankMappings: problem.blankMappings,
        level: problem.level
      });
      
      const { blankedCode, keywordsToBlank, completeCode, blankMappings } = problem;
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
      const totalBlanks = keywordsToBlank ? keywordsToBlank.length : 0;
      const results = [];
      
      if (!totalBlanks || totalBlanks === 0) {
        return {
          success: false,
          error: '문제 정보가 올바르지 않습니다 (keywordsToBlank가 없음)',
          score: 0,
          isCorrect: false
        };
      }
      
      // blankMappings 정보를 사용하여 정답 매핑 생성 (우선시)
      // blankMappings가 있으면 각 BLANK_ID가 어떤 키워드와 매핑되는지 확인
      let answerMapping = null;
      if (blankMappings && Array.isArray(blankMappings) && blankMappings.length > 0) {
        // blankMappings를 Map으로 변환하여 빠른 조회
        answerMapping = new Map();
        blankMappings.forEach(mapping => {
          answerMapping.set(mapping.blankId, mapping.keyword);
        });
        console.log('[GradingSystem] blankMappings를 사용한 정답 매핑:', answerMapping);
        console.log('[GradingSystem] blankMappings 상세:', blankMappings);
      }
      
      // 사용자 답안 배열 길이 검증 및 정규화
      if (userBlocks.length !== totalBlanks) {
        console.warn(`[GradingSystem] 블록코딩 답안 배열 길이 불일치: ${userBlocks.length} != ${totalBlanks}. 부족한 답안은 빈 문자열로 처리합니다.`);
        // 부족한 답안을 null로 채움
        while (userBlocks.length < totalBlanks) {
          userBlocks.push(null);
        }
        // 길면 자름
        if (userBlocks.length > totalBlanks) {
          userBlocks = userBlocks.slice(0, totalBlanks);
        }
      }
      
      // 각 블랭크에 대해 사용자 답안 확인
      for (let i = 0; i < totalBlanks; i++) {
        const blankId = i + 1;
        
        // blankMappings를 우선시하여 정답 결정
        // blankMappings가 있으면 그것을 사용하고, 없으면 keywordsToBlank 사용
        let correctAnswer;
        if (answerMapping && answerMapping.has(blankId)) {
          correctAnswer = answerMapping.get(blankId);
          console.log(`[GradingSystem] BLANK_${blankId} 정답 (blankMappings 사용): "${correctAnswer}"`);
        } else if (keywordsToBlank && keywordsToBlank[i]) {
          correctAnswer = keywordsToBlank[i];
          console.log(`[GradingSystem] BLANK_${blankId} 정답 (keywordsToBlank 사용): "${correctAnswer}"`);
        } else {
          console.warn(`[GradingSystem] BLANK_${blankId}의 정답을 찾을 수 없습니다.`);
          correctAnswer = null;
        }
        const userAnswer = userBlocks[i] !== undefined && userBlocks[i] !== null 
          ? String(userBlocks[i]).trim() 
          : null;
        
        if (!correctAnswer) {
          console.warn(`[GradingSystem] 블록코딩 빈칸 ${i + 1}의 정답이 없습니다.`);
          results.push({
            blankId,
            correctAnswer: correctAnswer || '',
            userAnswer: null,
            isCorrect: false,
            feedback: '정답 정보가 없습니다'
          });
          continue;
        }
        
        if (!userAnswer || userAnswer === '') {
          results.push({
            blankId,
            correctAnswer,
            userAnswer: null,
            isCorrect: false,
            feedback: '답안이 없습니다'
          });
          // 코드에 빈 문자열 적용 (또는 원본 유지)
          const placeholder = `BLANK_${blankId}`;
          userCode = userCode.replace(placeholder, '');
          continue;
        }
        
        // 답안 비교 (정규화된 값 사용)
        const isCorrect = this.compareAnswers(correctAnswer, userAnswer);
        
        // 상세 디버깅 로그
        console.log(`[GradingSystem] BLANK_${blankId} 채점:`, {
          correctAnswer: `"${correctAnswer}"`,
          userAnswer: `"${userAnswer}"`,
          isCorrect: isCorrect,
          comparisonDetails: {
            correctNormalized: this.normalizeAnswer(correctAnswer),
            userNormalized: this.normalizeAnswer(userAnswer)
          }
        });
        
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
      
      // 채점 결과 상세 로그
      console.log(`[GradingSystem] 채점 완료: ${correctCount}/${totalBlanks} (${score}점)`);
      console.log('[GradingSystem] 채점 결과 상세:', results.map(r => ({
        blankId: r.blankId,
        correct: `"${r.correctAnswer}"`,
        user: `"${r.userAnswer}"`,
        match: r.isCorrect ? '✓' : '✗'
      })));
      
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
      console.log('[GradingSystem] 문제 정보:', {
        hasTemplateCode: !!problem.templateCode,
        hasSolutions: !!problem.solutions,
        hasBlocks: !!problem.blocks,
        hasKeywordsToBlank: !!problem.keywordsToBlank,
        hasBlankMappings: !!problem.blankMappings,
        blankMappings: problem.blankMappings,
        solutions: problem.solutions,
        level: problem.level
      });
      
      const { templateCode, solutions, blocks, keywordsToBlank, blankMappings } = problem;
      const { userAnswers } = userAnswer; // 사용자가 입력한 답안들
      
      if (!userAnswers || !Array.isArray(userAnswers)) {
        return {
          success: false,
          error: '사용자 답안이 올바르지 않습니다',
          score: 0,
          isCorrect: false
        };
      }
      
      // blankMappings 정보를 사용하여 정답 매핑 생성 (우선시)
      // blankMappings가 있으면 각 BLANK_ID가 어떤 키워드와 매핑되는지 확인
      let answerMapping = null;
      if (blankMappings && Array.isArray(blankMappings) && blankMappings.length > 0) {
        // blankMappings를 Map으로 변환하여 빠른 조회 (blankId -> keyword)
        // 레벨 2처럼 blankId를 직접 키로 사용하여 확실한 매핑 보장
        answerMapping = new Map();
        blankMappings.forEach(mapping => {
          answerMapping.set(mapping.blankId, mapping.keyword);
        });
        console.log('[GradingSystem] blankMappings를 사용한 정답 매핑 (blankId -> keyword):', answerMapping);
        console.log('[GradingSystem] blankMappings 상세:', blankMappings);
      }
      
      // blankMappings가 있으면 그것을 기준으로 totalBlanks 결정
      // 없으면 solutions/keywordsToBlank 사용
      let totalBlanks;
      let correctAnswers;
      
      if (answerMapping && answerMapping.size > 0) {
        // blankMappings가 있으면 그것의 개수를 totalBlanks로 사용
        totalBlanks = answerMapping.size;
        console.log(`[GradingSystem] blankMappings에서 총 ${totalBlanks}개의 빈칸 확인`);
      } else if (solutions && Array.isArray(solutions)) {
        correctAnswers = solutions.map(s => s.answer);
        totalBlanks = correctAnswers.length;
      } else if (blocks && Array.isArray(blocks)) {
        correctAnswers = blocks.filter(b => b.type === 'answer').map(b => b.text);
        totalBlanks = correctAnswers.length;
      } else if (keywordsToBlank && Array.isArray(keywordsToBlank)) {
        correctAnswers = keywordsToBlank;
        totalBlanks = correctAnswers.length;
      } else {
        return {
          success: false,
          error: '문제 정보가 올바르지 않습니다 (blankMappings, solutions, blocks, keywordsToBlank 중 하나 필요)',
          score: 0,
          isCorrect: false
        };
      }
      
      let correctCount = 0;
      const results = [];
      
      // 사용자 답안 배열 길이 검증 및 정규화
      if (userAnswers.length !== totalBlanks) {
        console.warn(`[GradingSystem] 사용자 답안 배열 길이 불일치: ${userAnswers.length} != ${totalBlanks}. 부족한 답안은 빈 문자열로 처리합니다.`);
        // 부족한 답안을 빈 문자열로 채움
        while (userAnswers.length < totalBlanks) {
          userAnswers.push('');
        }
        // 길면 자름 (보통 발생하지 않지만 안전을 위해)
        if (userAnswers.length > totalBlanks) {
          userAnswers = userAnswers.slice(0, totalBlanks);
        }
      }
      
      // 각 빈칸에 대해 사용자 답안 확인
      for (let i = 0; i < totalBlanks; i++) {
        const blankId = i + 1;
        
        // blankMappings를 우선시하여 정답 결정
        // blankMappings가 있으면 그것을 사용하고, 없으면 solutions/keywordsToBlank 사용
        let correctAnswer;
        if (answerMapping && answerMapping.has(blankId)) {
          correctAnswer = answerMapping.get(blankId);
          console.log(`[GradingSystem] 빈칸 ${blankId} (__${blankId}__) 정답 (blankMappings 사용): "${correctAnswer}"`);
        } else if (correctAnswers && correctAnswers[i]) {
          correctAnswer = correctAnswers[i];
          console.log(`[GradingSystem] 빈칸 ${blankId} (__${blankId}__) 정답 (solutions/keywordsToBlank 사용): "${correctAnswer}"`);
        } else {
          console.warn(`[GradingSystem] 빈칸 ${blankId} (__${blankId}__)의 정답을 찾을 수 없습니다.`);
          correctAnswer = null;
        }
        
        // userAnswer가 undefined, null, 또는 빈 문자열일 수 있으므로 명확히 처리
        const userAnswer = userAnswers[i] !== undefined && userAnswers[i] !== null 
          ? String(userAnswers[i]).trim() 
          : '';
        
        // 정답이 없거나 사용자 답안이 비어있는 경우
        if (!correctAnswer) {
          console.warn(`[GradingSystem] 빈칸 ${blankId}의 정답이 없습니다.`);
          results.push({
            blankId: blankId,
            correctAnswer: correctAnswer || '',
            userAnswer: userAnswer || null,
            isCorrect: false,
            feedback: '정답 정보가 없습니다'
          });
          continue;
        }
        
        if (!userAnswer || userAnswer === '') {
          results.push({
            blankId: blankId,
            correctAnswer: correctAnswer,
            userAnswer: null,
            isCorrect: false,
            feedback: '답안이 없습니다'
          });
          continue;
        }
        
        // 답안 비교 (정규화된 값 사용)
        const isCorrect = this.compareAnswers(correctAnswer, userAnswer);
        
        // 상세 디버깅 로그
        console.log(`[GradingSystem] 빈칸 ${blankId} 채점:`, {
          correctAnswer: `"${correctAnswer}"`,
          userAnswer: `"${userAnswer}"`,
          isCorrect: isCorrect,
          comparisonDetails: {
            correctNormalized: this.normalizeAnswer(correctAnswer),
            userNormalized: this.normalizeAnswer(userAnswer)
          }
        });
        if (isCorrect) {
          correctCount++;
        }
        
        results.push({
          blankId: blankId,
          correctAnswer: correctAnswer,
          userAnswer: userAnswer,
          isCorrect,
          feedback: isCorrect ? '정답입니다!' : `틀렸습니다. 정답은 "${correctAnswer}"입니다.`
        });
      }
      
      const score = Math.round((correctCount / totalBlanks) * 100);
      const isCorrect = correctCount === totalBlanks;
      
      // 채점 결과 상세 로그
      console.log(`[GradingSystem] 빈칸채우기 채점 완료: ${correctCount}/${totalBlanks} (${score}점)`);
      console.log('[GradingSystem] 채점 결과 상세:', results.map(r => ({
        blankId: r.blankId,
        correct: `"${r.correctAnswer}"`,
        user: `"${r.userAnswer}"`,
        match: r.isCorrect ? '✓' : '✗'
      })));
      
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
   * 답안 정규화 헬퍼 함수
   * @param {string} answer - 답안
   * @returns {string} 정규화된 답안
   */
  static normalizeAnswer(answer) {
    if (!answer) return '';
    const str = String(answer).trim();
    if (!str) return '';
    // 대소문자 무시, 공백 정규화 (연속된 공백을 하나로)
    return str.toLowerCase().replace(/\s+/g, ' ').trim();
  }
  
  /**
   * 답안 비교 (대소문자 무시, 공백 정규화)
   * @param {string} correct - 정답
   * @param {string} user - 사용자 답안
   * @returns {boolean} 일치 여부
   */
  static compareAnswers(correct, user) {
    if (!correct || !user) return false;
    
    // 문자열로 변환
    const correctStr = String(correct).trim();
    const userStr = String(user).trim();
    
    // 빈 문자열 체크
    if (!correctStr || !userStr) return false;
    
    // 정규화된 값 비교
    const normalizedCorrect = this.normalizeAnswer(correctStr);
    const normalizedUser = this.normalizeAnswer(userStr);
    
    // 정확히 일치하는지 확인
    return normalizedCorrect === normalizedUser;
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
