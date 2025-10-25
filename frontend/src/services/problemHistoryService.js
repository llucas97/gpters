/**
 * 문제 풀이 기록 조회 서비스
 * 사용자의 문제 풀이 기록, 통계, 성취도를 조회하는 API 클라이언트
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class ProblemHistoryService {
  
  /**
   * 사용자 문제 풀이 기록 조회
   * @param {string} userId - 사용자 ID
   * @param {Object} options - 조회 옵션
   * @returns {Promise<Object>} 풀이 기록
   */
  static async getUserProblemHistory(userId, options = {}) {
    try {
      console.log('[ProblemHistoryService] 사용자 풀이 기록 조회:', { userId, options });
      
      const queryParams = new URLSearchParams();
      
      if (options.problemType) queryParams.append('problemType', options.problemType);
      if (options.level !== undefined) queryParams.append('level', options.level);
      if (options.isCorrect !== undefined) queryParams.append('isCorrect', options.isCorrect);
      if (options.limit) queryParams.append('limit', options.limit);
      if (options.offset) queryParams.append('offset', options.offset);
      if (options.startDate) queryParams.append('startDate', options.startDate);
      if (options.endDate) queryParams.append('endDate', options.endDate);
      
      const url = `${API_BASE_URL}/api/grading/user-history/${userId}?${queryParams.toString()}`;
      
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('[ProblemHistoryService] 풀이 기록 조회 결과:', result);
      
      return result;
      
    } catch (error) {
      console.error('[ProblemHistoryService] 풀이 기록 조회 오류:', error);
      return {
        success: false,
        error: error.message,
        totalCount: 0,
        records: [],
        stats: null
      };
    }
  }
  
  /**
   * 사용자 통계 조회
   * @param {string} userId - 사용자 ID
   * @param {Object} options - 필터 옵션
   * @returns {Promise<Object>} 통계 정보
   */
  static async getUserStats(userId, options = {}) {
    try {
      console.log('[ProblemHistoryService] 사용자 통계 조회:', { userId, options });
      
      const queryParams = new URLSearchParams();
      
      if (options.problemType) queryParams.append('problemType', options.problemType);
      if (options.level !== undefined) queryParams.append('level', options.level);
      
      const url = `${API_BASE_URL}/api/grading/user-stats/${userId}?${queryParams.toString()}`;
      
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('[ProblemHistoryService] 통계 조회 결과:', result);
      
      return result;
      
    } catch (error) {
      console.error('[ProblemHistoryService] 통계 조회 오류:', error);
      return {
        success: false,
        error: error.message,
        stats: null
      };
    }
  }
  
  /**
   * 사용자 레벨별 성취도 조회
   * @param {string} userId - 사용자 ID
   * @returns {Promise<Object>} 레벨별 성취도
   */
  static async getUserLevelProgress(userId) {
    try {
      console.log('[ProblemHistoryService] 레벨별 성취도 조회:', { userId });
      
      const response = await fetch(`${API_BASE_URL}/api/grading/user-progress/${userId}`, {
        method: 'GET',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('[ProblemHistoryService] 레벨별 성취도 조회 결과:', result);
      
      return result;
      
    } catch (error) {
      console.error('[ProblemHistoryService] 레벨별 성취도 조회 오류:', error);
      return {
        success: false,
        error: error.message,
        levelProgress: []
      };
    }
  }
  
  /**
   * 문제별 풀이 기록 조회
   * @param {string} problemId - 문제 ID
   * @param {Object} options - 조회 옵션
   * @returns {Promise<Object>} 문제별 풀이 기록
   */
  static async getProblemHistory(problemId, options = {}) {
    try {
      console.log('[ProblemHistoryService] 문제별 풀이 기록 조회:', { problemId, options });
      
      const queryParams = new URLSearchParams();
      
      if (options.limit) queryParams.append('limit', options.limit);
      if (options.offset) queryParams.append('offset', options.offset);
      
      const url = `${API_BASE_URL}/api/grading/problem-history/${problemId}?${queryParams.toString()}`;
      
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('[ProblemHistoryService] 문제별 풀이 기록 조회 결과:', result);
      
      return result;
      
    } catch (error) {
      console.error('[ProblemHistoryService] 문제별 풀이 기록 조회 오류:', error);
      return {
        success: false,
        error: error.message,
        totalCount: 0,
        records: []
      };
    }
  }
  
  /**
   * 최근 풀이 기록 조회 (간단한 버전)
   * @param {string} userId - 사용자 ID
   * @param {number} limit - 조회할 개수 (기본값: 10)
   * @returns {Promise<Object>} 최근 풀이 기록
   */
  static async getRecentHistory(userId, limit = 10) {
    try {
      console.log('[ProblemHistoryService] 최근 풀이 기록 조회:', { userId, limit });
      
      const result = await this.getUserProblemHistory(userId, { limit });
      
      return {
        success: result.success,
        records: result.records || [],
        totalCount: result.totalCount || 0
      };
      
    } catch (error) {
      console.error('[ProblemHistoryService] 최근 풀이 기록 조회 오류:', error);
      return {
        success: false,
        error: error.message,
        records: [],
        totalCount: 0
      };
    }
  }
  
  /**
   * 레벨별 문제 풀이 현황 조회
   * @param {string} userId - 사용자 ID
   * @param {number} level - 레벨
   * @returns {Promise<Object>} 레벨별 풀이 현황
   */
  static async getLevelHistory(userId, level) {
    try {
      console.log('[ProblemHistoryService] 레벨별 풀이 현황 조회:', { userId, level });
      
      const result = await this.getUserProblemHistory(userId, { level, limit: 100 });
      
      return {
        success: result.success,
        records: result.records || [],
        totalCount: result.totalCount || 0,
        stats: result.stats
      };
      
    } catch (error) {
      console.error('[ProblemHistoryService] 레벨별 풀이 현황 조회 오류:', error);
      return {
        success: false,
        error: error.message,
        records: [],
        totalCount: 0,
        stats: null
      };
    }
  }
  
  /**
   * 문제 유형별 풀이 현황 조회
   * @param {string} userId - 사용자 ID
   * @param {string} problemType - 문제 유형
   * @returns {Promise<Object>} 유형별 풀이 현황
   */
  static async getTypeHistory(userId, problemType) {
    try {
      console.log('[ProblemHistoryService] 유형별 풀이 현황 조회:', { userId, problemType });
      
      const result = await this.getUserProblemHistory(userId, { problemType, limit: 100 });
      
      return {
        success: result.success,
        records: result.records || [],
        totalCount: result.totalCount || 0,
        stats: result.stats
      };
      
    } catch (error) {
      console.error('[ProblemHistoryService] 유형별 풀이 현황 조회 오류:', error);
      return {
        success: false,
        error: error.message,
        records: [],
        totalCount: 0,
        stats: null
      };
    }
  }
}

export default ProblemHistoryService;
