// backend/controllers/levelController.js
const LevelService = require('../services/levelService');
const db = require('../models');

/**
 * 레벨 관련 API 컨트롤러
 */
class LevelController {

  /**
   * 레벨 배정
   * POST /api/level/assign
   */
  static async assignLevel(req, res) {
    try {
      const { userId, options = {} } = req.body;
      const requestUserId = req.user?.user_id;

      // 입력 검증
      if (!userId) {
        return res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'User ID is required',
          details: {
            required_fields: ['userId'],
            provided: { userId: !!userId }
          }
        });
      }

      // 권한 확인 (본인의 레벨만 배정 가능)
      if (requestUserId && parseInt(userId) !== requestUserId) {
        return res.status(403).json({
          error: 'ACCESS_DENIED',
          message: 'You can only assign levels for your own account'
        });
      }

      // 사용자 존재 확인
      const user = await db.User.findByPk(userId);
      if (!user) {
        return res.status(404).json({
          error: 'RESOURCE_NOT_FOUND',
          message: 'User not found',
          details: { resource_type: 'user', user_id: userId }
        });
      }

      // 최근 제출 기록 확인
      const recentSubmissions = await db.Submission.findAll({
        where: { 
          user_id: userId,
          submitted_at: {
            [db.Sequelize.Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30일 전
          }
        },
        limit: 5
      });

      if (recentSubmissions.length === 0) {
        return res.status(422).json({
          error: 'BUSINESS_LOGIC_ERROR',
          message: 'Insufficient submission data for level assignment',
          details: {
            required_submissions: 'At least 5 submissions in the last 30 days',
            current_submissions: recentSubmissions.length
          }
        });
      }

      // 레벨 배정 수행
      const result = await LevelService.assignLevel(userId, options);

      res.status(201).json({
        success: true,
        message: 'Level assigned successfully',
        data: result
      });

    } catch (error) {
      console.error('Error assigning level:', error);
      res.status(500).json({
        error: 'SYSTEM_ERROR',
        message: 'Failed to assign level',
        details: { operation: 'assign_level', retry_possible: true }
      });
    }
  }

  /**
   * 레벨 변경 이력 조회
   * GET /api/level/history/:userId
   */
  static async getLevelHistory(req, res) {
    try {
      const { userId } = req.params;
      const { limit = 10 } = req.query;
      const requestUserId = req.user?.user_id;

      // 권한 확인
      if (requestUserId && parseInt(userId) !== requestUserId) {
        return res.status(403).json({
          error: 'ACCESS_DENIED',
          message: 'You can only access your own level history'
        });
      }

      // 사용자 존재 확인
      const user = await db.User.findByPk(userId, {
        attributes: ['user_id', 'username', 'current_level']
      });

      if (!user) {
        return res.status(404).json({
          error: 'RESOURCE_NOT_FOUND',
          message: 'User not found',
          details: { resource_type: 'user', user_id: userId }
        });
      }

      // 레벨 진행 상황 조회
      const levelProgress = await LevelService.getUserLevelProgress(userId, parseInt(limit));

      res.json({
        success: true,
        data: levelProgress
      });

    } catch (error) {
      console.error('Error getting level history:', error);
      res.status(500).json({
        error: 'SYSTEM_ERROR',
        message: 'Failed to retrieve level history',
        details: { operation: 'get_level_history', retry_possible: true }
      });
    }
  }

  /**
   * 현재 레벨 정보 조회
   * GET /api/level/current/:userId
   */
  static async getCurrentLevel(req, res) {
    try {
      const { userId } = req.params;
      const requestUserId = req.user?.user_id;

      // 권한 확인
      if (requestUserId && parseInt(userId) !== requestUserId) {
        return res.status(403).json({
          error: 'ACCESS_DENIED',
          message: 'You can only access your own level information'
        });
      }

      // 사용자 정보 조회
      const user = await db.User.findByPk(userId, {
        attributes: ['user_id', 'username', 'current_level', 'experience_points']
      });

      if (!user) {
        return res.status(404).json({
          error: 'RESOURCE_NOT_FOUND',
          message: 'User not found',
          details: { resource_type: 'user', user_id: userId }
        });
      }

      // 최근 테스트 결과 조회
      const recentResult = await db.TestResult.findOne({
        where: { user_id: userId },
        order: [['created_at', 'DESC']],
        attributes: ['overall_score', 'assigned_level', 'created_at']
      });

      const currentLevel = LevelService.mapNumericToLevel(user.current_level);
      const currentScore = recentResult?.overall_score || 0;

      // 다음 레벨 정보 계산
      const nextLevelInfo = LevelService.getNextLevelInfo(currentLevel, currentScore);

      // 추천 난이도 계산
      const recommendedDifficulties = LevelService.getRecommendedDifficulties(currentLevel);

      res.json({
        success: true,
        data: {
          userId: user.user_id,
          username: user.username,
          currentLevel: {
            level: currentLevel,
            numericLevel: user.current_level,
            displayName: this.getLevelDisplayName(currentLevel)
          },
          experiencePoints: user.experience_points,
          recentScore: currentScore,
          nextLevel: nextLevelInfo,
          recommendedDifficulties,
          lastTestDate: recentResult?.created_at || null
        }
      });

    } catch (error) {
      console.error('Error getting current level:', error);
      res.status(500).json({
        error: 'SYSTEM_ERROR',
        message: 'Failed to retrieve current level information',
        details: { operation: 'get_current_level', retry_possible: true }
      });
    }
  }

  /**
   * 레벨 통계 조회
   * GET /api/level/stats/:userId
   */
  static async getLevelStats(req, res) {
    try {
      const { userId } = req.params;
      const { period = '30' } = req.query; // 기본 30일
      const requestUserId = req.user?.user_id;

      // 권한 확인
      if (requestUserId && parseInt(userId) !== requestUserId) {
        return res.status(403).json({
          error: 'ACCESS_DENIED',
          message: 'You can only access your own level statistics'
        });
      }

      // 기간 설정
      const daysAgo = parseInt(period);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      // 해당 기간의 테스트 결과 조회
      const testResults = await db.TestResult.findAll({
        where: {
          user_id: userId,
          created_at: {
            [db.Sequelize.Op.gte]: startDate
          }
        },
        order: [['created_at', 'ASC']],
        include: [
          {
            model: db.TestSession,
            as: 'session',
            attributes: ['test_type']
          }
        ]
      });

      // 통계 계산
      const stats = this.calculateLevelStatistics(testResults, daysAgo);

      res.json({
        success: true,
        data: {
          userId: parseInt(userId),
          period: `${daysAgo} days`,
          statistics: stats
        }
      });

    } catch (error) {
      console.error('Error getting level statistics:', error);
      res.status(500).json({
        error: 'SYSTEM_ERROR',
        message: 'Failed to retrieve level statistics',
        details: { operation: 'get_level_stats', retry_possible: true }
      });
    }
  }

  /**
   * 레벨 추천 조회
   * GET /api/level/recommendations/:userId
   */
  static async getLevelRecommendations(req, res) {
    try {
      const { userId } = req.params;
      const requestUserId = req.user?.user_id;

      // 권한 확인
      if (requestUserId && parseInt(userId) !== requestUserId) {
        return res.status(403).json({
          error: 'ACCESS_DENIED',
          message: 'You can only access your own recommendations'
        });
      }

      // 사용자 현재 레벨 조회
      const user = await db.User.findByPk(userId, {
        attributes: ['user_id', 'current_level']
      });

      if (!user) {
        return res.status(404).json({
          error: 'RESOURCE_NOT_FOUND',
          message: 'User not found'
        });
      }

      const currentLevel = LevelService.mapNumericToLevel(user.current_level);

      // 최근 테스트 결과 분석
      const recentResults = await db.TestResult.findAll({
        where: { user_id: userId },
        order: [['created_at', 'DESC']],
        limit: 5,
        attributes: ['overall_score', 'accuracy_rate', 'improvement_areas', 'strengths']
      });

      // 추천사항 생성
      const recommendations = this.generateRecommendations(currentLevel, recentResults);

      res.json({
        success: true,
        data: {
          userId: parseInt(userId),
          currentLevel,
          recommendations
        }
      });

    } catch (error) {
      console.error('Error getting level recommendations:', error);
      res.status(500).json({
        error: 'SYSTEM_ERROR',
        message: 'Failed to retrieve level recommendations',
        details: { operation: 'get_recommendations', retry_possible: true }
      });
    }
  }

  /**
   * 레벨 표시명 반환
   * @param {string} level - 레벨
   * @returns {string} 표시명
   */
  static getLevelDisplayName(level) {
    const displayNames = {
      beginner: '초급자',
      intermediate: '중급자',
      advanced: '고급자'
    };
    return displayNames[level] || '미정';
  }

  /**
   * 레벨 통계 계산
   * @param {Array} testResults - 테스트 결과 배열
   * @param {number} period - 기간 (일)
   * @returns {Object} 통계 정보
   */
  static calculateLevelStatistics(testResults, period) {
    if (!testResults || testResults.length === 0) {
      return {
        totalTests: 0,
        averageScore: 0,
        scoreImprovement: 0,
        levelChanges: 0,
        testFrequency: 0,
        performanceTrend: 'no_data'
      };
    }

    const scores = testResults.map(r => r.overall_score);
    const levelChanges = testResults.filter(r => r.level_change !== 'maintained').length;

    // 평균 점수
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;

    // 점수 개선 (첫 번째와 마지막 비교)
    const scoreImprovement = testResults.length > 1 
      ? testResults[testResults.length - 1].overall_score - testResults[0].overall_score
      : 0;

    // 테스트 빈도 (기간 대비 테스트 수)
    const testFrequency = testResults.length / period;

    // 성과 트렌드
    let performanceTrend = 'stable';
    if (testResults.length >= 3) {
      const recent = scores.slice(-Math.ceil(scores.length / 2));
      const earlier = scores.slice(0, Math.floor(scores.length / 2));
      
      const recentAvg = recent.reduce((sum, score) => sum + score, 0) / recent.length;
      const earlierAvg = earlier.reduce((sum, score) => sum + score, 0) / earlier.length;
      
      const improvement = recentAvg - earlierAvg;
      
      if (improvement > 5) performanceTrend = 'improving';
      else if (improvement < -5) performanceTrend = 'declining';
    }

    // 레벨별 분포
    const levelDistribution = testResults.reduce((dist, result) => {
      const level = result.assigned_level;
      dist[level] = (dist[level] || 0) + 1;
      return dist;
    }, {});

    return {
      totalTests: testResults.length,
      averageScore: Math.round(averageScore * 100) / 100,
      scoreImprovement: Math.round(scoreImprovement * 100) / 100,
      levelChanges,
      testFrequency: Math.round(testFrequency * 100) / 100,
      performanceTrend,
      levelDistribution,
      bestScore: Math.max(...scores),
      worstScore: Math.min(...scores)
    };
  }

  /**
   * 추천사항 생성
   * @param {string} currentLevel - 현재 레벨
   * @param {Array} recentResults - 최근 결과들
   * @returns {Array} 추천사항 배열
   */
  static generateRecommendations(currentLevel, recentResults) {
    const recommendations = [];

    // 기본 레벨별 추천
    const levelRecommendations = {
      beginner: [
        {
          type: 'study',
          priority: 'high',
          title: '기초 개념 학습',
          description: '프로그래밍 기본 문법과 개념을 충분히 학습하세요.',
          action: '기초 문제를 반복 연습하고 개념을 확실히 이해하세요.'
        }
      ],
      intermediate: [
        {
          type: 'practice',
          priority: 'high',
          title: '알고리즘 연습',
          description: '다양한 알고리즘 문제를 풀어보세요.',
          action: '중급 난이도의 문제를 꾸준히 연습하세요.'
        }
      ],
      advanced: [
        {
          type: 'challenge',
          priority: 'medium',
          title: '고급 문제 도전',
          description: '복잡한 알고리즘과 자료구조 문제에 도전하세요.',
          action: '실제 프로젝트에 적용할 수 있는 고급 기법을 학습하세요.'
        }
      ]
    };

    recommendations.push(...(levelRecommendations[currentLevel] || []));

    // 최근 결과 기반 추천
    if (recentResults && recentResults.length > 0) {
      const latestResult = recentResults[0];
      
      // 정확도 기반 추천
      if (latestResult.accuracy_rate < 70) {
        recommendations.push({
          type: 'improvement',
          priority: 'high',
          title: '정확도 향상',
          description: '문제 해결 정확도를 높이는 것이 필요합니다.',
          action: '기본 개념을 다시 복습하고 신중하게 문제를 풀어보세요.'
        });
      }

      // 약점 영역 기반 추천
      if (latestResult.improvement_areas && latestResult.improvement_areas.length > 0) {
        const topWeakness = latestResult.improvement_areas[0];
        recommendations.push({
          type: 'focus',
          priority: 'medium',
          title: `${topWeakness.area} 영역 집중 학습`,
          description: `${topWeakness.area} 영역에서 개선이 필요합니다.`,
          action: `${topWeakness.area} 관련 문제를 집중적으로 연습하세요.`
        });
      }

      // 강점 활용 추천
      if (latestResult.strengths && latestResult.strengths.length > 0) {
        const topStrength = latestResult.strengths[0];
        recommendations.push({
          type: 'leverage',
          priority: 'low',
          title: `${topStrength.area} 강점 활용`,
          description: `${topStrength.area} 영역에서 뛰어난 실력을 보이고 있습니다.`,
          action: `이 강점을 활용하여 더 어려운 ${topStrength.area} 문제에 도전해보세요.`
        });
      }
    }

    return recommendations.slice(0, 5); // 최대 5개 추천사항
  }
}

module.exports = LevelController;