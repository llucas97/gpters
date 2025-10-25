/**
 * 경험치 및 레벨 관리 서비스
 * 사용자의 경험치, 레벨, 성취도 관리를 위한 API 클라이언트
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class ExperienceService {
  
  /**
   * 사용자 경험치 정보 조회
   * @param {string} userId - 사용자 ID
   * @returns {Promise<Object>} 경험치 정보
   */
  static async getUserExperience(userId) {
    try {
      console.log('[ExperienceService] 사용자 경험치 정보 조회:', { userId });
      
      const response = await fetch(`${API_BASE_URL}/api/experience/${userId}`, {
        method: 'GET',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('[ExperienceService] 경험치 정보 조회 결과:', result);
      
      return result;
      
    } catch (error) {
      console.error('[ExperienceService] 경험치 정보 조회 오류:', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }
  
  /**
   * 문제 해결 후 경험치 추가
   * @param {string} userId - 사용자 ID
   * @param {Object} problemData - 문제 데이터
   * @returns {Promise<Object>} 업데이트된 경험치 정보
   */
  static async addExperience(userId, problemData) {
    try {
      console.log('[ExperienceService] 경험치 추가 요청:', { userId, problemData });
      
      const response = await fetch(`${API_BASE_URL}/api/experience/${userId}/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(problemData)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('[ExperienceService] 경험치 추가 결과:', result);
      
      return result;
      
    } catch (error) {
      console.error('[ExperienceService] 경험치 추가 오류:', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }
  
  /**
   * 사용자 경험치 통계 조회
   * @param {string} userId - 사용자 ID
   * @returns {Promise<Object>} 경험치 통계
   */
  static async getUserExperienceStats(userId) {
    try {
      console.log('[ExperienceService] 사용자 경험치 통계 조회:', { userId });
      
      const response = await fetch(`${API_BASE_URL}/api/experience/${userId}/stats`, {
        method: 'GET',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('[ExperienceService] 경험치 통계 조회 결과:', result);
      
      return result;
      
    } catch (error) {
      console.error('[ExperienceService] 경험치 통계 조회 오류:', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }
  
  /**
   * 레벨 순위 조회
   * @param {number} limit - 조회할 개수 (기본값: 10)
   * @returns {Promise<Object>} 레벨 순위
   */
  static async getLevelRanking(limit = 10) {
    try {
      console.log('[ExperienceService] 레벨 순위 조회:', { limit });
      
      const response = await fetch(`${API_BASE_URL}/api/experience/ranking?limit=${limit}`, {
        method: 'GET',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('[ExperienceService] 레벨 순위 조회 결과:', result);
      
      return result;
      
    } catch (error) {
      console.error('[ExperienceService] 레벨 순위 조회 오류:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }
  
  /**
   * 특정 레벨 정보 조회
   * @param {number} level - 레벨
   * @returns {Promise<Object>} 레벨 정보
   */
  static async getLevelInfo(level) {
    try {
      console.log('[ExperienceService] 레벨 정보 조회:', { level });
      
      const response = await fetch(`${API_BASE_URL}/api/experience/level/${level}`, {
        method: 'GET',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('[ExperienceService] 레벨 정보 조회 결과:', result);
      
      return result;
      
    } catch (error) {
      console.error('[ExperienceService] 레벨 정보 조회 오류:', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }
  
  /**
   * 경험치 계산 시뮬레이션
   * @param {Object} problemData - 문제 데이터
   * @returns {Promise<Object>} 계산 결과
   */
  static async calculateExperience(problemData) {
    try {
      console.log('[ExperienceService] 경험치 계산 시뮬레이션:', problemData);
      
      const queryParams = new URLSearchParams();
      
      Object.keys(problemData).forEach(key => {
        if (problemData[key] !== undefined && problemData[key] !== null) {
          queryParams.append(key, problemData[key]);
        }
      });
      
      const response = await fetch(`${API_BASE_URL}/api/experience/calculate?${queryParams.toString()}`, {
        method: 'GET',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('[ExperienceService] 경험치 계산 결과:', result);
      
      return result;
      
    } catch (error) {
      console.error('[ExperienceService] 경험치 계산 오류:', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }
  
  /**
   * 경험치 리셋 (관리자용)
   * @param {string} userId - 사용자 ID
   * @returns {Promise<Object>} 리셋 결과
   */
  static async resetUserExperience(userId) {
    try {
      console.log('[ExperienceService] 경험치 리셋 요청:', { userId });
      
      const response = await fetch(`${API_BASE_URL}/api/experience/${userId}/reset`, {
        method: 'POST',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('[ExperienceService] 경험치 리셋 결과:', result);
      
      return result;
      
    } catch (error) {
      console.error('[ExperienceService] 경험치 리셋 오류:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * 경험치 바 진행률 계산
   * @param {Object} experienceData - 경험치 데이터
   * @returns {Object} 진행률 정보
   */
  static calculateProgress(experienceData) {
    if (!experienceData) {
      return {
        percentage: 0,
        current: 0,
        required: 100,
        display: '0 / 100'
      };
    }
    
    const { currentLevelExp, expToNextLevel, progressPercentage } = experienceData;
    
    return {
      percentage: progressPercentage || 0,
      current: currentLevelExp || 0,
      required: expToNextLevel || 100,
      display: `${currentLevelExp || 0} / ${expToNextLevel || 100}`
    };
  }
  
  /**
   * 레벨업 애니메이션 데이터 생성
   * @param {Object} oldData - 이전 경험치 데이터
   * @param {Object} newData - 새로운 경험치 데이터
   * @returns {Object} 애니메이션 데이터
   */
  static generateLevelUpAnimation(oldData, newData) {
    if (!oldData || !newData || !newData.leveledUp) {
      return null;
    }
    
    return {
      leveledUp: true,
      oldLevel: oldData.level || 1,
      newLevel: newData.level || 1,
      levelUpCount: newData.levelUpCount || 1,
      gainedExperience: newData.gainedExperience || 0,
      reward: newData.levelUpReward || null,
      animation: {
        type: 'level_up',
        duration: 2000,
        effects: ['sparkles', 'level_badge', 'experience_bar']
      }
    };
  }
}

export default ExperienceService;
