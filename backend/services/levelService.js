// backend/services/levelService.js
const FeedbackGenerator = require('../utils/feedbackGenerator');
const AnalysisService = require('./analysisService');
const db = require('../models');

/**
 * 레벨 배정 및 관리 서비스
 */
class LevelService {

  /**
   * 레벨 배정 임계값 설정
   */
  static LEVEL_THRESHOLDS = {
    beginner: { min: 0, max: 40 },
    intermediate: { min: 41, max: 70 },
    advanced: { min: 71, max: 100 }
  };

  /**
   * 자동 레벨 배정 (submissions 기반)
   * @param {number} userId - 사용자 ID
   * @param {Object} options - 분석 옵션
   * @returns {Object} 레벨 배정 결과
   */
  static async assignLevel(userId, options = {}) {
    try {
      // 사용자 정보 조회
      const user = await db.User.findByPk(userId);
      if (!user) {
        throw new Error(`User ${userId} not found`);
      }

      // 최근 제출 기록 분석 (기본적으로 최근 30일, 레벨 테스트만)
      const analysisOptions = {
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30일 전
        problemType: 'level_test',
        limit: 50,
        ...options
      };

      // 사용자 제출 기록 분석
      const analysis = await AnalysisService.analyzeUserSubmissions(userId, analysisOptions);
      
      if (!analysis || !analysis.metrics) {
        throw new Error('Invalid analysis result - insufficient submission data');
      }

      const { overallScore } = analysis.metrics;
      const previousLevel = user.current_level ? this.mapNumericToLevel(user.current_level) : null;
      
      // 점수 기반 레벨 결정
      const assignedLevel = this.determineLevelFromScore(overallScore);
      
      // 레벨 변경 상태 결정
      const levelChange = this.determineLevelChange(assignedLevel, previousLevel);
      
      // 개인화된 피드백 생성
      const feedback = FeedbackGenerator.generateLevelFeedback(
        assignedLevel,
        previousLevel,
        analysis.metrics,
        analysis.patterns.weakAreas,
        analysis.patterns.strengths
      );

      // 통계 테이블에 결과 저장
      await this.saveAnalysisToStatistics(userId, analysis, assignedLevel, levelChange);

      // 사용자 레벨 업데이트
      await this.updateUserLevel(userId, assignedLevel, `Level assignment based on recent submissions analysis`);

      return {
        success: true,
        userId,
        assignedLevel,
        previousLevel,
        levelChange,
        overallScore,
        feedback,
        analysisData: analysis,
        timestamp: new Date()
      };

    } catch (error) {
      console.error('Error assigning level:', error);
      throw new Error(`Failed to assign level: ${error.message}`);
    }
  }

  /**
   * 점수 기반 레벨 결정
   * @param {number} score - 종합 점수 (0-100)
   * @returns {string} 레벨
   */
  static determineLevelFromScore(score) {
    if (score >= this.LEVEL_THRESHOLDS.advanced.min) {
      return 'advanced';
    } else if (score >= this.LEVEL_THRESHOLDS.intermediate.min) {
      return 'intermediate';
    } else {
      return 'beginner';
    }
  }

  /**
   * 레벨 변경 상태 결정
   * @param {string} newLevel - 새 레벨
   * @param {string} previousLevel - 이전 레벨
   * @returns {string} 변경 상태
   */
  static determineLevelChange(newLevel, previousLevel) {
    if (!previousLevel) return 'initial';

    const levelOrder = { beginner: 1, intermediate: 2, advanced: 3 };
    const newOrder = levelOrder[newLevel];
    const prevOrder = levelOrder[previousLevel];

    if (newOrder > prevOrder) return 'promoted';
    if (newOrder < prevOrder) return 'demoted';
    return 'maintained';
  }

  /**
   * 사용자 레벨 업데이트
   * @param {number} userId - 사용자 ID
   * @param {string} newLevel - 새 레벨
   * @param {string} reason - 변경 사유
   * @returns {Object} 업데이트 결과
   */
  static async updateUserLevel(userId, newLevel, reason = '') {
    try {
      const numericLevel = this.mapLevelToNumeric(newLevel);
      
      const [updatedRowsCount] = await db.User.update(
        { 
          current_level: numericLevel,
          updated_at: new Date()
        },
        { 
          where: { user_id: userId } 
        }
      );

      if (updatedRowsCount === 0) {
        throw new Error(`Failed to update level for user ${userId}`);
      }

      console.log(`User ${userId} level updated to ${newLevel} (${numericLevel}). Reason: ${reason}`);

      return {
        success: true,
        userId,
        newLevel,
        numericLevel,
        reason,
        updatedAt: new Date()
      };

    } catch (error) {
      console.error('Error updating user level:', error);
      throw new Error(`Failed to update user level: ${error.message}`);
    }
  }

  /**
   * 사용자의 최근 제출 기록 기반 레벨 진행 상황 조회
   * @param {number} userId - 사용자 ID
   * @param {number} limit - 조회할 제출 개수
   * @returns {Object} 레벨 진행 상황
   */
  static async getUserLevelProgress(userId, limit = 20) {
    try {
      const user = await db.User.findByPk(userId, {
        attributes: ['user_id', 'username', 'current_level', 'experience_points']
      });

      if (!user) {
        throw new Error(`User ${userId} not found`);
      }

      // 최근 제출 기록들 조회
      const recentSubmissions = await db.Submission.findAll({
        where: { user_id: userId },
        order: [['submitted_at', 'DESC']],
        limit,
        include: [
          {
            model: db.Problem,
            as: 'problem',
            attributes: ['problem_id', 'difficulty', 'category', 'level', 'problem_type']
          }
        ]
      });

      // 최근 통계 조회
      const recentStats = await db.Statistics.findAll({
        where: { user_id: userId },
        order: [['period_start', 'DESC']],
        limit: 3
      });

      // 진행 상황 분석
      const currentLevel = this.mapNumericToLevel(user.current_level);
      const progressAnalysis = this.analyzeLevelProgressFromSubmissions(recentSubmissions);

      return {
        userId,
        username: user.username,
        currentLevel,
        currentLevelNumeric: user.current_level,
        experiencePoints: user.experience_points,
        
        progress: progressAnalysis,
        recentSubmissions: recentSubmissions.slice(0, 10).map(submission => ({
          problemId: submission.problem_id,
          problemType: submission.problem?.problem_type,
          difficulty: submission.problem?.difficulty,
          result: submission.result,
          score: submission.score,
          submittedAt: submission.submitted_at
        })),
        
        recentStats: recentStats.map(stat => ({
          period: `${stat.period_start.getFullYear()}-${stat.period_start.getMonth() + 1}`,
          problemsSolved: stat.problems_solved,
          accuracy: stat.correct_submissions / Math.max(stat.total_submissions, 1) * 100,
          totalSubmissions: stat.total_submissions
        }))
      };

    } catch (error) {
      console.error('Error getting user level progress:', error);
      throw new Error(`Failed to get user level progress: ${error.message}`);
    }
  }

  /**
   * 분석 결과를 통계 테이블에 저장
   * @param {number} userId - 사용자 ID
   * @param {Object} analysis - 분석 결과
   * @param {string} assignedLevel - 배정된 레벨
   * @param {string} levelChange - 레벨 변경 상태
   * @returns {Object} 저장 결과
   */
  static async saveAnalysisToStatistics(userId, analysis, assignedLevel, levelChange) {
    try {
      const currentDate = new Date();
      const periodStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1); // 월 시작
      const periodEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0); // 월 끝

      // 이번 달 통계 레코드 찾기 또는 생성
      const [statRecord, created] = await db.Statistics.findOrCreate({
        where: {
          user_id: userId,
          period_type: 'monthly',
          period_start: periodStart,
          period_end: periodEnd
        },
        defaults: {
          user_id: userId,
          period_type: 'monthly',
          period_start: periodStart,
          period_end: periodEnd,
          problems_solved: 0,
          problems_attempted: 0,
          correct_submissions: 0,
          total_submissions: 0,
          time_spent_minutes: 0,
          streak_days: 0,
          detailed_stats: {}
        }
      });

      // 통계 업데이트
      const updatedStats = {
        problems_attempted: statRecord.problems_attempted + analysis.summary.totalSubmissions,
        correct_submissions: statRecord.correct_submissions + analysis.summary.correctSubmissions,
        total_submissions: statRecord.total_submissions + analysis.summary.totalSubmissions,
        time_spent_minutes: statRecord.time_spent_minutes + Math.round(analysis.summary.averageExecutionTime / 1000 / 60),
        detailed_stats: {
          ...statRecord.detailed_stats,
          lastAnalysis: {
            date: currentDate,
            overallScore: analysis.metrics.overallScore,
            accuracyRate: analysis.metrics.accuracyRate,
            assignedLevel,
            levelChange,
            weakAreas: analysis.patterns.weakAreas,
            strengths: analysis.patterns.strengths
          }
        }
      };

      await statRecord.update(updatedStats);

      return {
        success: true,
        statisticsId: statRecord.stat_id,
        created,
        updated: !created
      };

    } catch (error) {
      console.error('Error saving analysis to statistics:', error);
      // 통계 저장 실패는 전체 프로세스를 중단시키지 않음
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 피드백을 텍스트로 변환
   * @param {Object} feedback - 피드백 객체
   * @returns {string} 피드백 텍스트
   */
  static generateFeedbackText(feedback) {
    let text = `${feedback.mainMessage.levelChange}\n\n`;
    text += `${feedback.mainMessage.encouragement}\n\n`;
    
    if (feedback.strengths.hasStrengths) {
      text += `강점: ${feedback.strengths.message}\n`;
      feedback.strengths.areas.forEach(strength => {
        text += `- ${strength.message}\n`;
      });
      text += '\n';
    }

    if (feedback.improvements.hasImprovements) {
      text += `개선 영역: ${feedback.improvements.message}\n`;
      feedback.improvements.areas.forEach(improvement => {
        text += `- ${improvement.message}\n`;
        text += `  제안: ${improvement.suggestion}\n`;
      });
      text += '\n';
    }

    text += '다음 단계:\n';
    feedback.nextSteps.forEach((step, index) => {
      text += `${index + 1}. ${step}\n`;
    });

    text += `\n${feedback.summary}`;

    return text;
  }

  /**
   * 사용자의 레벨 진행 상황 조회
   * @param {number} userId - 사용자 ID
   * @param {number} limit - 조회할 이력 개수
   * @returns {Object} 레벨 진행 상황
   */
  static async getUserLevelProgress(userId, limit = 10) {
    try {
      const user = await db.User.findByPk(userId, {
        attributes: ['user_id', 'username', 'current_level', 'experience_points']
      });

      if (!user) {
        throw new Error(`User ${userId} not found`);
      }

      // 최근 테스트 결과들 조회
      const recentResults = await db.TestResult.findAll({
        where: { user_id: userId },
        order: [['created_at', 'DESC']],
        limit,
        include: [
          {
            model: db.TestSession,
            as: 'session',
            attributes: ['session_id', 'test_type', 'start_time', 'end_time']
          }
        ]
      });

      // 레벨 변경 이력 조회 (있는 경우)
      let levelHistory = [];
      if (db.LevelHistory) {
        levelHistory = await db.LevelHistory.findAll({
          where: { user_id: userId },
          order: [['created_at', 'DESC']],
          limit: 5
        });
      }

      // 진행 상황 분석
      const currentLevel = this.mapNumericToLevel(user.current_level);
      const progressAnalysis = this.analyzeLevelProgress(recentResults);

      return {
        userId,
        username: user.username,
        currentLevel,
        currentLevelNumeric: user.current_level,
        experiencePoints: user.experience_points,
        
        progress: progressAnalysis,
        recentResults: recentResults.map(result => ({
          sessionId: result.session_id,
          testType: result.session?.test_type,
          overallScore: result.overall_score,
          assignedLevel: result.assigned_level,
          levelChange: result.level_change,
          testDate: result.created_at
        })),
        
        levelHistory: levelHistory.map(history => ({
          previousLevel: history.previous_level,
          newLevel: history.new_level,
          changeDate: history.created_at,
          reason: history.change_reason
        }))
      };

    } catch (error) {
      console.error('Error getting user level progress:', error);
      throw new Error(`Failed to get user level progress: ${error.message}`);
    }
  }

  /**
   * 제출 기록 기반 레벨 진행 상황 분석
   * @param {Array} submissions - 제출 기록 배열
   * @returns {Object} 진행 상황 분석
   */
  static analyzeLevelProgressFromSubmissions(submissions) {
    if (!submissions || submissions.length === 0) {
      return {
        trend: 'no_data',
        averageScore: 0,
        accuracy: 0,
        improvement: 0,
        consistency: 'unknown'
      };
    }

    const scores = submissions.map(s => s.score);
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    
    // 정확도 계산
    const correctSubmissions = submissions.filter(s => s.result === 'correct').length;
    const accuracy = (correctSubmissions / submissions.length) * 100;

    // 최근 절반과 이전 절반 비교
    let improvement = 0;
    if (submissions.length >= 6) {
      const midPoint = Math.floor(submissions.length / 2);
      const recent = scores.slice(0, midPoint);
      const previous = scores.slice(midPoint);
      
      const recentAvg = recent.reduce((sum, score) => sum + score, 0) / recent.length;
      const previousAvg = previous.reduce((sum, score) => sum + score, 0) / previous.length;
      
      improvement = recentAvg - previousAvg;
    }

    // 일관성 계산 (점수의 표준편차 기반)
    const mean = averageScore;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    const standardDeviation = Math.sqrt(variance);
    const consistency = standardDeviation < 10 ? 'high' : standardDeviation < 20 ? 'medium' : 'low';

    let trend = 'stable';
    if (improvement > 5) trend = 'improving';
    else if (improvement < -5) trend = 'declining';

    return {
      trend,
      averageScore: Math.round(averageScore * 100) / 100,
      accuracy: Math.round(accuracy * 100) / 100,
      improvement: Math.round(improvement * 100) / 100,
      consistency,
      totalSubmissions: submissions.length,
      standardDeviation: Math.round(standardDeviation * 100) / 100
    };
  }

  /**
   * 레벨을 숫자로 변환
   * @param {string} level - 레벨 문자열
   * @returns {number} 숫자 레벨
   */
  static mapLevelToNumeric(level) {
    const mapping = {
      beginner: 1,
      intermediate: 2,
      advanced: 3
    };
    return mapping[level] || 0;
  }

  /**
   * 숫자를 레벨로 변환
   * @param {number} numericLevel - 숫자 레벨
   * @returns {string} 레벨 문자열
   */
  static mapNumericToLevel(numericLevel) {
    const mapping = {
      0: 'beginner',
      1: 'beginner',
      2: 'intermediate',
      3: 'advanced'
    };
    return mapping[numericLevel] || 'beginner';
  }

  /**
   * 레벨별 추천 문제 난이도 반환
   * @param {string} level - 사용자 레벨
   * @returns {Array} 추천 난이도 배열
   */
  static getRecommendedDifficulties(level) {
    const recommendations = {
      beginner: ['beginner', 'easy'],
      intermediate: ['easy', 'medium'],
      advanced: ['medium', 'hard', 'expert']
    };
    
    return recommendations[level] || ['beginner'];
  }

  /**
   * 다음 레벨까지 필요한 점수 계산
   * @param {string} currentLevel - 현재 레벨
   * @param {number} currentScore - 현재 점수
   * @returns {Object} 다음 레벨 정보
   */
  static getNextLevelInfo(currentLevel, currentScore) {
    const levelOrder = ['beginner', 'intermediate', 'advanced'];
    const currentIndex = levelOrder.indexOf(currentLevel);
    
    if (currentIndex === -1 || currentIndex === levelOrder.length - 1) {
      return {
        isMaxLevel: true,
        message: '최고 레벨에 도달했습니다!'
      };
    }

    const nextLevel = levelOrder[currentIndex + 1];
    const nextLevelThreshold = this.LEVEL_THRESHOLDS[nextLevel].min;
    const pointsNeeded = Math.max(0, nextLevelThreshold - currentScore);

    return {
      isMaxLevel: false,
      nextLevel,
      currentScore,
      nextLevelThreshold,
      pointsNeeded,
      progress: Math.min(100, (currentScore / nextLevelThreshold) * 100),
      message: pointsNeeded > 0 
        ? `${nextLevel} 레벨까지 ${pointsNeeded}점이 더 필요합니다.`
        : `${nextLevel} 레벨 승급 조건을 만족했습니다!`
    };
  }
}

module.exports = LevelService;