/**
 * 사용자 통계 조회 서비스
 * 사용자의 문제 풀이 통계, 성취도, 분석 데이터를 조회하는 API 클라이언트
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class UserStatsService {
  
  /**
   * 사용자 전체 통계 개요 조회
   * @param {string} userId - 사용자 ID
   * @param {Object} options - 조회 옵션
   * @returns {Promise<Object>} 전체 통계
   */
  static async getOverview(userId, options = {}) {
    try {
      console.log('[UserStatsService] 전체 통계 조회:', { userId, options });
      
      const queryParams = new URLSearchParams();
      
      if (options.startDate) queryParams.append('startDate', options.startDate);
      if (options.endDate) queryParams.append('endDate', options.endDate);
      
      const url = `${API_BASE_URL}/api/user-stats/${userId}/overview?${queryParams.toString()}`;
      
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('[UserStatsService] 전체 통계 조회 결과:', result);
      
      return result;
      
    } catch (error) {
      console.error('[UserStatsService] 전체 통계 조회 오류:', error);
      return {
        success: false,
        error: error.message,
        stats: null
      };
    }
  }
  
  /**
   * 특정 레벨의 상세 통계 조회
   * @param {string} userId - 사용자 ID
   * @param {number} level - 레벨
   * @param {Object} options - 조회 옵션
   * @returns {Promise<Object>} 레벨별 상세 통계
   */
  static async getLevelStats(userId, level, options = {}) {
    try {
      console.log('[UserStatsService] 레벨별 통계 조회:', { userId, level, options });
      
      const queryParams = new URLSearchParams();
      
      if (options.startDate) queryParams.append('startDate', options.startDate);
      if (options.endDate) queryParams.append('endDate', options.endDate);
      
      const url = `${API_BASE_URL}/api/user-stats/${userId}/level/${level}?${queryParams.toString()}`;
      
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('[UserStatsService] 레벨별 통계 조회 결과:', result);
      
      return result;
      
    } catch (error) {
      console.error('[UserStatsService] 레벨별 통계 조회 오류:', error);
      return {
        success: false,
        error: error.message,
        analysis: null,
        records: []
      };
    }
  }
  
  /**
   * 특정 문제 유형의 상세 통계 조회
   * @param {string} userId - 사용자 ID
   * @param {string} problemType - 문제 유형
   * @param {Object} options - 조회 옵션
   * @returns {Promise<Object>} 유형별 상세 통계
   */
  static async getTypeStats(userId, problemType, options = {}) {
    try {
      console.log('[UserStatsService] 유형별 통계 조회:', { userId, problemType, options });
      
      const queryParams = new URLSearchParams();
      
      if (options.startDate) queryParams.append('startDate', options.startDate);
      if (options.endDate) queryParams.append('endDate', options.endDate);
      
      const url = `${API_BASE_URL}/api/user-stats/${userId}/type/${problemType}?${queryParams.toString()}`;
      
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('[UserStatsService] 유형별 통계 조회 결과:', result);
      
      return result;
      
    } catch (error) {
      console.error('[UserStatsService] 유형별 통계 조회 오류:', error);
      return {
        success: false,
        error: error.message,
        analysis: null,
        records: []
      };
    }
  }
  
  /**
   * 사용자 성취도 및 뱃지 조회
   * @param {string} userId - 사용자 ID
   * @returns {Promise<Object>} 성취도 정보
   */
  static async getAchievements(userId) {
    try {
      console.log('[UserStatsService] 성취도 조회:', { userId });
      
      const response = await fetch(`${API_BASE_URL}/api/user-stats/${userId}/achievements`, {
        method: 'GET',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('[UserStatsService] 성취도 조회 결과:', result);
      
      return result;
      
    } catch (error) {
      console.error('[UserStatsService] 성취도 조회 오류:', error);
      return {
        success: false,
        error: error.message,
        achievements: null
      };
    }
  }
  
  /**
   * 최근 7일 활동 조회
   * @param {string} userId - 사용자 ID
   * @returns {Promise<Object>} 최근 활동
   */
  static async getRecentActivity(userId) {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      
      const options = {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      };
      
      const result = await this.getOverview(userId, options);
      
      return {
        success: result.success,
        recentActivity: result.stats?.recentActivity || null,
        error: result.error
      };
      
    } catch (error) {
      console.error('[UserStatsService] 최근 활동 조회 오류:', error);
      return {
        success: false,
        error: error.message,
        recentActivity: null
      };
    }
  }
  
  /**
   * 레벨별 성취도 차트 데이터 생성
   * @param {string} userId - 사용자 ID
   * @returns {Promise<Object>} 차트 데이터
   */
  static async getLevelProgressChart(userId) {
    try {
      console.log('[UserStatsService] 레벨별 성취도 차트 데이터 조회:', { userId });
      
      const result = await this.getOverview(userId);
      
      if (!result.success || !result.stats) {
        return {
          success: false,
          error: '데이터를 불러올 수 없습니다',
          chartData: null
        };
      }
      
      const levelBreakdown = result.stats.levelBreakdown || [];
      
      // 차트 데이터 포맷팅
      const chartData = {
        labels: levelBreakdown.map(item => `레벨 ${item.level}`),
        datasets: [
          {
            label: '총 문제 수',
            data: levelBreakdown.map(item => item.totalProblems),
            backgroundColor: '#4ECDC4',
            borderColor: '#45B7D1',
            borderWidth: 1
          },
          {
            label: '정답 수',
            data: levelBreakdown.map(item => item.correctProblems),
            backgroundColor: '#96CEB4',
            borderColor: '#81C784',
            borderWidth: 1
          }
        ]
      };
      
      return {
        success: true,
        chartData
      };
      
    } catch (error) {
      console.error('[UserStatsService] 레벨별 성취도 차트 데이터 조회 오류:', error);
      return {
        success: false,
        error: error.message,
        chartData: null
      };
    }
  }
  
  /**
   * 문제 유형별 성취도 차트 데이터 생성
   * @param {string} userId - 사용자 ID
   * @returns {Promise<Object>} 차트 데이터
   */
  static async getTypeProgressChart(userId) {
    try {
      console.log('[UserStatsService] 유형별 성취도 차트 데이터 조회:', { userId });
      
      const result = await this.getOverview(userId);
      
      if (!result.success || !result.stats) {
        return {
          success: false,
          error: '데이터를 불러올 수 없습니다',
          chartData: null
        };
      }
      
      const typeBreakdown = result.stats.typeBreakdown || [];
      
      // 문제 유형 한글명 매핑
      const typeNames = {
        'block': '블록코딩',
        'cloze': '빈칸채우기',
        'code_editor': '코드에디터',
        'ordering': '순서배열',
        'bug_fix': '버그수정'
      };
      
      // 차트 데이터 포맷팅
      const chartData = {
        labels: typeBreakdown.map(item => typeNames[item.problemType] || item.problemType),
        datasets: [
          {
            label: '정확도 (%)',
            data: typeBreakdown.map(item => item.accuracy),
            backgroundColor: [
              '#FF6B6B',
              '#4ECDC4',
              '#45B7D1',
              '#96CEB4',
              '#FFEAA7'
            ],
            borderColor: [
              '#FF5252',
              '#26A69A',
              '#2196F3',
              '#81C784',
              '#FFD54F'
            ],
            borderWidth: 1
          }
        ]
      };
      
      return {
        success: true,
        chartData
      };
      
    } catch (error) {
      console.error('[UserStatsService] 유형별 성취도 차트 데이터 조회 오류:', error);
      return {
        success: false,
        error: error.message,
        chartData: null
      };
    }
  }
  
  /**
   * 시간대별 활동 패턴 조회
   * @param {string} userId - 사용자 ID
   * @returns {Promise<Object>} 시간대별 활동
   */
  static async getTimePattern(userId) {
    try {
      console.log('[UserStatsService] 시간대별 활동 패턴 조회:', { userId });
      
      const result = await this.getOverview(userId);
      
      if (!result.success || !result.stats) {
        return {
          success: false,
          error: '데이터를 불러올 수 없습니다',
          timePattern: null
        };
      }
      
      // 최근 7일 데이터로 시간대별 패턴 분석
      const recentResult = await this.getRecentActivity(userId);
      
      return {
        success: true,
        timePattern: recentResult.recentActivity || null
      };
      
    } catch (error) {
      console.error('[UserStatsService] 시간대별 활동 패턴 조회 오류:', error);
      return {
        success: false,
        error: error.message,
        timePattern: null
      };
    }
  }
}

export default UserStatsService;
