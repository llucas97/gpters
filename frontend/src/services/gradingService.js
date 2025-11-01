/**
 * 채점 서비스 API 클라이언트
 * 블록코딩과 빈칸채우기 문제의 답안을 채점하는 API 호출
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class GradingService {
  
  /**
   * 블록코딩 문제 채점
   * @param {Object} problem - 문제 정보
   * @param {Array} userBlocks - 사용자가 드래그한 블록들
   * @param {number} level - 레벨 (선택사항)
   * @param {string} userId - 사용자 ID
   * @param {number} timeSpent - 소요 시간 (초)
   * @returns {Promise<Object>} 채점 결과
   */
  static async gradeBlockCoding(problem, userBlocks, level = 0, userId = null, timeSpent = 0) {
    try {
      console.log('[GradingService] 블록코딩 채점 요청:', { problem: problem.title, userBlocks, userId, timeSpent });
      
      const response = await fetch(`${API_BASE_URL}/api/grading/grade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          problemType: 'block',
          problem,
          userAnswer: { userBlocks },
          level,
          userId,
          timeSpent
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('[GradingService] 블록코딩 채점 결과:', result);
      
      return result;
      
    } catch (error) {
      console.error('[GradingService] 블록코딩 채점 오류:', error);
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
   * @param {Array} userAnswers - 사용자가 입력한 답안들
   * @param {number} level - 레벨 (선택사항)
   * @param {string} userId - 사용자 ID
   * @param {number} timeSpent - 소요 시간 (초)
   * @returns {Promise<Object>} 채점 결과
   */
  static async gradeClozeTest(problem, userAnswers, level = 0, userId = null, timeSpent = 0) {
    try {
      console.log('[GradingService] 빈칸채우기 채점 요청:', { problem: problem.title, userAnswers, userId, timeSpent });
      
      const response = await fetch(`${API_BASE_URL}/api/grading/grade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          problemType: 'cloze',
          problem,
          userAnswer: { userAnswers },
          level,
          userId,
          timeSpent
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('[GradingService] 빈칸채우기 채점 결과:', result);
      
      return result;
      
    } catch (error) {
      console.error('[GradingService] 빈칸채우기 채점 오류:', error);
      return {
        success: false,
        error: error.message,
        score: 0,
        isCorrect: false
      };
    }
  }
  
  /**
   * 코드 검증
   * @param {string} code - 검증할 코드
   * @param {string} language - 프로그래밍 언어 (기본값: javascript)
   * @returns {Promise<Object>} 검증 결과
   */
  static async validateCode(code, language = 'javascript') {
    try {
      console.log('[GradingService] 코드 검증 요청:', { language, codeLength: code.length });
      
      const response = await fetch(`${API_BASE_URL}/api/grading/validate-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ code, language })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('[GradingService] 코드 검증 결과:', result);
      
      return result;
      
    } catch (error) {
      console.error('[GradingService] 코드 검증 오류:', error);
      return {
        success: false,
        error: error.message,
        validation: { isValid: false, message: '검증 실패' }
      };
    }
  }
  
  /**
   * 채점 시스템 상태 확인
   * @returns {Promise<Object>} 상태 정보
   */
  static async checkHealth() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/grading/health`, {
        method: 'GET',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('[GradingService] 시스템 상태:', result);
      
      return result;
      
    } catch (error) {
      console.error('[GradingService] 상태 확인 오류:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * 통합 채점 함수 (문제 유형 자동 감지)
   * @param {Object} problem - 문제 정보
   * @param {Object} userAnswer - 사용자 답안
   * @param {number} level - 레벨 (선택사항)
   * @param {string} userId - 사용자 ID
   * @returns {Promise<Object>} 채점 결과
   */
  static async grade(problem, userAnswer, level = 0, userId = null) {
    try {
      // 문제 유형 자동 감지
      let problemType = 'cloze'; // 기본값
      
      if (problem.blocks && Array.isArray(problem.blocks)) {
        problemType = 'block';
      } else if (problem.templateCode && problem.solutions) {
        problemType = 'cloze';
      }
      
      console.log('[GradingService] 통합 채점:', { 
        problemType, 
        problem: problem.title, 
        level,
        userId
      });
      
      const response = await fetch(`${API_BASE_URL}/api/grading/grade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          problemType,
          problem,
          userAnswer,
          level,
          userId
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('[GradingService] 통합 채점 결과:', result);
      
      return result;
      
    } catch (error) {
      console.error('[GradingService] 통합 채점 오류:', error);
      return {
        success: false,
        error: error.message,
        score: 0,
        isCorrect: false
      };
    }
  }
}

export default GradingService;
