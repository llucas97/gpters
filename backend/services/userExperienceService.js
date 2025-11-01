'use strict';

const { UserExperience } = require('../models');
const ExperienceSystem = require('./experienceSystem');

/**
 * 사용자 경험치 및 레벨 관리 서비스
 */
class UserExperienceService {
  
  /**
   * 사용자 경험치 정보 조회 또는 생성
   * @param {number} userId - 사용자 ID
   * @returns {Promise<Object>} 경험치 정보
   */
  static async getUserExperience(userId) {
    try {
      console.log('[UserExperienceService] 사용자 경험치 정보 조회:', { userId });
      
      let userExp = await UserExperience.findOne({
        where: { user_id: userId }
      });
      
      // 경험치 정보가 없으면 새로 생성
      if (!userExp) {
        userExp = await UserExperience.create({
          user_id: userId,
          totalExperience: 0,
          level: 1,
          currentLevelExp: 0,
          expToNextLevel: 100,
          progressPercentage: 0,
          totalLevelUps: 0,
          highestLevel: 1,
          dailyExperience: 0,
          weeklyExperience: 0,
          monthlyExperience: 0
        });
        
        console.log('[UserExperienceService] 새로운 경험치 정보 생성:', userExp.id);
      }
      
      // 레벨 정보 업데이트
      const levelInfo = ExperienceSystem.getUserLevelInfo(userExp);
      
      return {
        success: true,
        data: {
          id: userExp.id,
          userId: userExp.user_id,
          totalExperience: userExp.totalExperience,
          level: levelInfo.level,
          currentLevelExp: levelInfo.currentLevelExp,
          expToNextLevel: levelInfo.expToNextLevel,
          progressPercentage: levelInfo.progressPercentage,
          lastLevelUpAt: userExp.lastLevelUpAt,
          totalLevelUps: userExp.totalLevelUps,
          highestLevel: userExp.highestLevel,
          dailyExperience: userExp.dailyExperience,
          weeklyExperience: userExp.weeklyExperience,
          monthlyExperience: userExp.monthlyExperience,
          levelInfo
        }
      };
      
    } catch (error) {
      console.error('[UserExperienceService] 경험치 정보 조회 오류:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * 문제 해결 후 경험치 추가
   * @param {number} userId - 사용자 ID
   * @param {Object} problemData - 문제 데이터
   * @returns {Promise<Object>} 업데이트된 경험치 정보
   */
  static async addExperienceFromProblem(userId, problemData) {
    try {
      console.log('[UserExperienceService] 문제 해결 경험치 추가:', { userId, problemData });
      
      // 현재 경험치 정보 조회
      const currentExp = await this.getUserExperience(userId);
      if (!currentExp.success) {
        throw new Error('경험치 정보를 불러올 수 없습니다');
      }
      
      const userExpData = currentExp.data;
      
      // 경험치 추가 및 레벨업 처리
      const updatedData = ExperienceSystem.addExperience(userExpData, problemData);
      
      // 데이터베이스 업데이트
      const updateData = {
        totalExperience: updatedData.totalExperience,
        level: updatedData.level,
        currentLevelExp: updatedData.currentLevelExp,
        expToNextLevel: updatedData.expToNextLevel,
        progressPercentage: updatedData.progressPercentage,
        highestLevel: Math.max(userExpData.highestLevel, updatedData.level)
      };
      
      // 레벨업 시 추가 업데이트
      if (updatedData.leveledUp) {
        updateData.lastLevelUpAt = new Date();
        updateData.totalLevelUps = userExpData.totalLevelUps + updatedData.levelUpCount;
        
        // 경험치 이력에 레벨업 기록 추가
        const history = userExpData.experienceHistory || [];
        history.push({
          type: 'level_up',
          level: updatedData.level,
          timestamp: new Date(),
          gainedExperience: updatedData.gainedExperience
        });
        updateData.experienceHistory = history;
      }
      
      // 일일/주간/월간 경험치 업데이트
      const now = new Date();
      const lastReset = userExpData.lastExperienceReset ? new Date(userExpData.lastExperienceReset) : null;
      
      // 날짜가 바뀌었으면 일일 경험치 리셋
      if (!lastReset || now.toDateString() !== lastReset.toDateString()) {
        updateData.dailyExperience = updatedData.gainedExperience;
      } else {
        updateData.dailyExperience = userExpData.dailyExperience + updatedData.gainedExperience;
      }
      
      // 주간/월간 경험치 업데이트
      updateData.weeklyExperience = userExpData.weeklyExperience + updatedData.gainedExperience;
      updateData.monthlyExperience = userExpData.monthlyExperience + updatedData.gainedExperience;
      updateData.lastExperienceReset = now;
      
      // 데이터베이스 업데이트
      await UserExperience.update(updateData, {
        where: { user_id: userId }
      });
      
      console.log('[UserExperienceService] 경험치 업데이트 완료:', {
        userId,
        gainedExp: updatedData.gainedExperience,
        newLevel: updatedData.level,
        leveledUp: updatedData.leveledUp
      });
      
      return {
        success: true,
        data: {
          ...updatedData,
          leveledUp: updatedData.leveledUp,
          levelUpCount: updatedData.levelUpCount,
          gainedExperience: updatedData.gainedExperience,
          levelUpReward: updatedData.leveledUp ? 
            ExperienceSystem.calculateLevelUpReward(updatedData.level) : null
        }
      };
      
    } catch (error) {
      console.error('[UserExperienceService] 경험치 추가 오류:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * 사용자 레벨 순위 조회
   * @param {number} limit - 조회할 개수
   * @returns {Promise<Object>} 레벨 순위
   */
  static async getLevelRanking(limit = 10) {
    try {
      console.log('[UserExperienceService] 레벨 순위 조회:', { limit });
      
      const rankings = await UserExperience.findAll({
        order: [
          ['level', 'DESC'],
          ['totalExperience', 'DESC']
        ],
        limit,
        include: [
          {
            model: require('../models').User,
            as: 'user',
            attributes: ['user_id', 'username', 'email']
          }
        ]
      });
      
      return {
        success: true,
        data: rankings.map((rank, index) => ({
          rank: index + 1,
          userId: rank.user_id,
          username: rank.user?.username || `User${rank.user_id}`,
          level: rank.level,
          totalExperience: rank.totalExperience,
          highestLevel: rank.highestLevel
        }))
      };
      
    } catch (error) {
      console.error('[UserExperienceService] 레벨 순위 조회 오류:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * 사용자 경험치 통계 조회
   * @param {number} userId - 사용자 ID
   * @returns {Promise<Object>} 경험치 통계
   */
  static async getUserExperienceStats(userId) {
    try {
      console.log('[UserExperienceService] 사용자 경험치 통계 조회:', { userId });
      
      const userExp = await this.getUserExperience(userId);
      if (!userExp.success) {
        throw new Error('경험치 정보를 불러올 수 없습니다');
      }
      
      const data = userExp.data;
      
      // 다음 목표 레벨까지 필요한 경험치
      const nextLevelExp = ExperienceSystem.calculateExperienceToNextLevel(data.level);
      const next5LevelExp = ExperienceSystem.calculateExperienceToTargetLevel(data.level, data.level + 5);
      
      // 경험치 획득 패턴 분석
      const history = data.experienceHistory || [];
      const recentGains = history.slice(-10); // 최근 10개 기록
      const averageGain = recentGains.length > 0 ? 
        recentGains.reduce((sum, h) => sum + (h.gainedExperience || 0), 0) / recentGains.length : 0;
      
      return {
        success: true,
        data: {
          current: data,
          nextLevel: {
            requiredExp: nextLevelExp,
            progress: data.progressPercentage
          },
          goals: {
            next5Levels: next5LevelExp
          },
          patterns: {
            averageGain: Math.round(averageGain),
            recentGains: recentGains.length,
            dailyExp: data.dailyExperience,
            weeklyExp: data.weeklyExperience,
            monthlyExp: data.monthlyExperience
          }
        }
      };
      
    } catch (error) {
      console.error('[UserExperienceService] 경험치 통계 조회 오류:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * 경험치 리셋 (관리자용)
   * @param {number} userId - 사용자 ID
   * @returns {Promise<Object>} 리셋 결과
   */
  static async resetUserExperience(userId) {
    try {
      console.log('[UserExperienceService] 사용자 경험치 리셋:', { userId });
      
      await UserExperience.update({
        totalExperience: 0,
        level: 1,
        currentLevelExp: 0,
        expToNextLevel: 100,
        progressPercentage: 0,
        totalLevelUps: 0,
        highestLevel: 1,
        dailyExperience: 0,
        weeklyExperience: 0,
        monthlyExperience: 0,
        experienceHistory: [],
        lastExperienceReset: new Date()
      }, {
        where: { user_id: userId }
      });
      
      return {
        success: true,
        message: '경험치가 성공적으로 리셋되었습니다'
      };
      
    } catch (error) {
      console.error('[UserExperienceService] 경험치 리셋 오류:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = UserExperienceService;
