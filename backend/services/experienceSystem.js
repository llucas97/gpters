'use strict';

/**
 * 경험치 및 레벨 시스템
 * 지수 분배 알고리즘을 사용한 경험치 계산 및 레벨 관리
 */
class ExperienceSystem {
  
  /**
   * 레벨별 최대 경험치 계산 (지수 분배)
   * @param {number} level - 레벨
   * @returns {number} 해당 레벨까지 필요한 총 경험치
   */
  static calculateMaxExperience(level) {
    if (level <= 0) return 0;
    if (level === 1) return 100; // 레벨 1까지는 100 경험치
    
    // 지수 분배: 각 레벨마다 필요한 경험치가 2배씩 증가
    // 레벨 1: 100, 레벨 2: 200, 레벨 3: 400, 레벨 4: 800, ...
    return 100 * Math.pow(2, level - 1);
  }
  
  /**
   * 현재 레벨에서 다음 레벨까지 필요한 경험치 계산
   * @param {number} level - 현재 레벨
   * @returns {number} 다음 레벨까지 필요한 경험치
   */
  static calculateExperienceToNextLevel(level) {
    const currentLevelExp = this.calculateMaxExperience(level);
    const nextLevelExp = this.calculateMaxExperience(level + 1);
    return nextLevelExp - currentLevelExp;
  }
  
  /**
   * 현재 경험치로부터 레벨 계산
   * @param {number} totalExperience - 총 경험치
   * @returns {Object} 레벨 정보
   */
  static calculateLevelFromExperience(totalExperience) {
    let level = 1;
    let currentExp = totalExperience;
    
    // 각 레벨의 최대 경험치를 확인하여 현재 레벨 계산
    while (currentExp >= this.calculateMaxExperience(level + 1)) {
      level++;
    }
    
    const currentLevelMaxExp = this.calculateMaxExperience(level);
    const nextLevelMaxExp = this.calculateMaxExperience(level + 1);
    const currentLevelExp = currentExp - currentLevelMaxExp;
    const expToNextLevel = nextLevelMaxExp - currentExp;
    
    return {
      level,
      currentLevelExp,
      expToNextLevel,
      totalExperience,
      currentLevelMaxExp,
      nextLevelMaxExp,
      progressPercentage: Math.round((currentLevelExp / (nextLevelMaxExp - currentLevelMaxExp)) * 100)
    };
  }
  
  /**
   * 문제 해결에 따른 경험치 계산
   * @param {Object} problemData - 문제 데이터
   * @returns {number} 획득할 경험치
   */
  static calculateExperienceGain(problemData) {
    const {
      level = 0,
      problemType = 'cloze',
      score = 0,
      isCorrect = false,
      isFirstAttempt = true,
      timeSpent = 0
    } = problemData;
    
    // 기본 경험치 (레벨에 따라 증가)
    let baseExp = 10 + (level * 5); // 레벨 0: 10, 레벨 1: 15, 레벨 2: 20, ...
    
    // 정답 여부에 따른 보너스
    if (isCorrect) {
      baseExp *= 1.5; // 정답 시 1.5배 보너스
      
      // 점수에 따른 추가 보너스
      if (score >= 90) {
        baseExp *= 1.2; // 90점 이상 시 1.2배 추가 보너스
      } else if (score >= 80) {
        baseExp *= 1.1; // 80점 이상 시 1.1배 추가 보너스
      }
    } else {
      baseExp *= 0.3; // 오답 시 30%만 획득
    }
    
    // 첫 시도 보너스
    if (isFirstAttempt && isCorrect) {
      baseExp *= 1.3; // 첫 시도 정답 시 1.3배 보너스
    }
    
    // 문제 유형별 보너스
    const typeMultipliers = {
      'block': 1.0,      // 블록코딩: 기본
      'cloze': 1.1,      // 빈칸채우기: 10% 보너스
      'code_editor': 1.3, // 코드에디터: 30% 보너스
      'ordering': 1.2,   // 순서배열: 20% 보너스
      'bug_fix': 1.4     // 버그수정: 40% 보너스
    };
    
    baseExp *= typeMultipliers[problemType] || 1.0;
    
    // 시간 보너스 (빠른 해결 시)
    if (timeSpent > 0) {
      const timeBonus = Math.max(0.8, 1.0 - (timeSpent / 300000)); // 5분 기준
      baseExp *= timeBonus;
    }
    
    return Math.round(baseExp);
  }
  
  /**
   * 경험치 추가 및 레벨업 처리
   * @param {Object} userData - 사용자 데이터
   * @param {Object} problemData - 문제 데이터
   * @returns {Object} 업데이트된 사용자 데이터
   */
  static addExperience(userData, problemData) {
    const currentExp = userData.totalExperience || 0;
    const currentLevel = userData.level || 1;
    
    // 획득할 경험치 계산
    const gainedExp = this.calculateExperienceGain(problemData);
    const newTotalExp = currentExp + gainedExp;
    
    // 새로운 레벨 정보 계산
    const newLevelInfo = this.calculateLevelFromExperience(newTotalExp);
    
    // 레벨업 여부 확인
    const leveledUp = newLevelInfo.level > currentLevel;
    const levelUpCount = newLevelInfo.level - currentLevel;
    
    return {
      ...userData,
      totalExperience: newTotalExp,
      level: newLevelInfo.level,
      currentLevelExp: newLevelInfo.currentLevelExp,
      expToNextLevel: newLevelInfo.expToNextLevel,
      progressPercentage: newLevelInfo.progressPercentage,
      leveledUp,
      levelUpCount,
      gainedExperience: gainedExp,
      levelInfo: newLevelInfo
    };
  }
  
  /**
   * 사용자 레벨 정보 조회
   * @param {Object} userData - 사용자 데이터
   * @returns {Object} 레벨 정보
   */
  static getUserLevelInfo(userData) {
    const totalExp = userData.totalExperience || 0;
    return this.calculateLevelFromExperience(totalExp);
  }
  
  /**
   * 레벨업 보상 계산
   * @param {number} level - 레벨
   * @returns {Object} 레벨업 보상
   */
  static calculateLevelUpReward(level) {
    const rewards = {
      // 레벨별 특별 보상
      special: {
        5: { title: '초보 탈출', description: '5레벨 달성!', bonus: 50 },
        10: { title: '학습자', description: '10레벨 달성!', bonus: 100 },
        20: { title: '숙련자', description: '20레벨 달성!', bonus: 200 },
        50: { title: '전문가', description: '50레벨 달성!', bonus: 500 },
        100: { title: '마스터', description: '100레벨 달성!', bonus: 1000 }
      }
    };
    
    // 특별 보상 확인
    const specialReward = rewards.special[level];
    if (specialReward) {
      return {
        type: 'special',
        ...specialReward
      };
    }
    
    // 일반 레벨업 보상
    return {
      type: 'normal',
      title: `${level}레벨 달성!`,
      description: '축하합니다!',
      bonus: Math.round(level * 2) // 레벨 * 2의 보너스 경험치
    };
  }
  
  /**
   * 레벨별 통계 생성
   * @param {Array} userRecords - 사용자 기록 배열
   * @returns {Object} 레벨별 통계
   */
  static generateLevelStatistics(userRecords) {
    const stats = {};
    
    userRecords.forEach(record => {
      const level = record.level || 1;
      if (!stats[level]) {
        stats[level] = {
          totalProblems: 0,
          correctProblems: 0,
          totalExperience: 0,
          averageScore: 0,
          totalTime: 0
        };
      }
      
      stats[level].totalProblems++;
      if (record.is_correct) stats[level].correctProblems++;
      stats[level].totalExperience += record.score || 0;
      stats[level].totalTime += record.duration_ms || 0;
    });
    
    // 평균 계산
    Object.keys(stats).forEach(level => {
      const stat = stats[level];
      stat.averageScore = stat.totalProblems > 0 ? stat.totalExperience / stat.totalProblems : 0;
      stat.accuracy = stat.totalProblems > 0 ? (stat.correctProblems / stat.totalProblems) * 100 : 0;
      stat.averageTime = stat.totalProblems > 0 ? stat.totalTime / stat.totalProblems : 0;
    });
    
    return stats;
  }
  
  /**
   * 다음 목표 레벨까지 필요한 경험치 계산
   * @param {number} currentLevel - 현재 레벨
   * @param {number} targetLevel - 목표 레벨
   * @returns {number} 필요한 총 경험치
   */
  static calculateExperienceToTargetLevel(currentLevel, targetLevel) {
    if (targetLevel <= currentLevel) return 0;
    
    const currentExp = this.calculateMaxExperience(currentLevel);
    const targetExp = this.calculateMaxExperience(targetLevel);
    
    return targetExp - currentExp;
  }
}

module.exports = ExperienceSystem;
