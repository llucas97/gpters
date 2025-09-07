// backend/services/analysisService.js
const MetricsCalculator = require('../utils/metricsCalculator');
const db = require('../models');

/**
 * 테스트 결과 분석 서비스
 */
class AnalysisService {

  /**
   * 사용자 제출 기록 종합 분석
   * @param {number} userId - 사용자 ID
   * @param {Object} options - 분석 옵션 (기간, 문제 타입 등)
   * @returns {Object} 종합 분석 결과
   */
  static async analyzeUserSubmissions(userId, options = {}) {
    try {
      const { 
        startDate = null, 
        endDate = null, 
        problemType = null,
        limit = 100 
      } = options;

      // 조건 설정
      const whereCondition = { user_id: userId };
      if (startDate) whereCondition.submitted_at = { [db.Sequelize.Op.gte]: startDate };
      if (endDate) {
        whereCondition.submitted_at = whereCondition.submitted_at 
          ? { ...whereCondition.submitted_at, [db.Sequelize.Op.lte]: endDate }
          : { [db.Sequelize.Op.lte]: endDate };
      }

      const problemWhereCondition = {};
      if (problemType) problemWhereCondition.problem_type = problemType;

      // 사용자 제출 기록 조회
      const submissions = await db.Submission.findAll({
        where: whereCondition,
        limit,
        order: [['submitted_at', 'DESC']],
        include: [
          {
            model: db.Problem,
            as: 'problem',
            where: problemWhereCondition,
            attributes: ['problem_id', 'difficulty', 'category', 'level', 'problem_type']
          },
          {
            model: db.User,
            as: 'user',
            attributes: ['user_id', 'current_level', 'experience_points']
          }
        ]
      });

      if (!submissions || submissions.length === 0) {
        return {
          userId,
          status: 'no_submissions',
          message: 'No submissions found for analysis'
        };
      }
      // 기본 메트릭 계산
      const accuracyRate = MetricsCalculator.calculateAccuracyRate(submissions);
      const averageResponseTime = MetricsCalculator.calculateAverageResponseTime(submissions);
      const consistencyScore = MetricsCalculator.calculateConsistencyScore(submissions);
      const speedScore = MetricsCalculator.calculateSpeedScore(averageResponseTime);

      // 종합 점수 계산
      const overallScore = MetricsCalculator.calculateWeightedScore(
        accuracyRate,
        speedScore,
        consistencyScore
      );

      // 오답 패턴 분석
      const incorrectAnalysis = MetricsCalculator.analyzeIncorrectAnswers(submissions);

      // 성과 트렌드 분석
      const trendAnalysis = MetricsCalculator.analyzeTrend(submissions);

      // 난이도별 성과 분석
      const difficultyAnalysis = this.analyzeDifficultyPerformance(submissions);

      // 카테고리별 성과 분석
      const categoryAnalysis = this.analyzeCategoryPerformance(submissions);

      // 약점 영역 식별
      const weakAreas = this.identifyWeakAreas(submissions, difficultyAnalysis, categoryAnalysis);

      // 강점 영역 식별
      const strengths = this.identifyStrengths(submissions, difficultyAnalysis, categoryAnalysis);

      // 평균 점수 계산
      const averageScore = this.calculateAverageScore(submissions);

      return {
        userId,
        analysisTimestamp: new Date(),
        analysisOptions: options,
        
        // 기본 메트릭
        metrics: {
          accuracyRate,
          averageResponseTime,
          consistencyScore,
          speedScore,
          overallScore,
          averageScore
        },

        // 상세 분석
        detailedAnalysis: {
          incorrectAnalysis,
          trendAnalysis,
          difficultyAnalysis,
          categoryAnalysis
        },

        // 식별된 패턴
        patterns: {
          weakAreas,
          strengths
        },

        // 통계 요약
        summary: {
          totalSubmissions: submissions.length,
          correctSubmissions: submissions.filter(s => s.result === 'correct').length,
          averageExecutionTime: averageResponseTime,
          totalScore: submissions.reduce((sum, s) => sum + s.score, 0)
        }
      };

    } catch (error) {
      console.error('Error analyzing test session:', error);
      throw new Error(`Failed to analyze test session: ${error.message}`);
    }
  }

  /**
   * 난이도별 성과 분석 (submissions 기반)
   * @param {Array} submissions - 사용자 제출 배열
   * @returns {Object} 난이도별 분석 결과
   */
  static analyzeDifficultyPerformance(submissions) {
    const difficultyGroups = {};

    submissions.forEach(submission => {
      const difficulty = submission.problem?.difficulty || 'unknown';
      
      if (!difficultyGroups[difficulty]) {
        difficultyGroups[difficulty] = [];
      }
      
      difficultyGroups[difficulty].push(submission);
    });

    const analysis = {};
    
    Object.keys(difficultyGroups).forEach(difficulty => {
      const groupSubmissions = difficultyGroups[difficulty];
      
      analysis[difficulty] = {
        totalSubmissions: groupSubmissions.length,
        accuracy: MetricsCalculator.calculateAccuracyRate(groupSubmissions),
        averageTime: MetricsCalculator.calculateAverageResponseTime(groupSubmissions),
        averageScore: this.calculateAverageScore(groupSubmissions)
      };
    });

    return analysis;
  }

  /**
   * 카테고리별 성과 분석 (submissions 기반)
   * @param {Array} submissions - 사용자 제출 배열
   * @returns {Object} 카테고리별 분석 결과
   */
  static analyzeCategoryPerformance(submissions) {
    const categoryGroups = {};

    submissions.forEach(submission => {
      const category = submission.problem?.category || 'unknown';
      
      if (!categoryGroups[category]) {
        categoryGroups[category] = [];
      }
      
      categoryGroups[category].push(submission);
    });

    const analysis = {};
    
    Object.keys(categoryGroups).forEach(category => {
      const groupSubmissions = categoryGroups[category];
      
      analysis[category] = {
        totalSubmissions: groupSubmissions.length,
        accuracy: MetricsCalculator.calculateAccuracyRate(groupSubmissions),
        averageTime: MetricsCalculator.calculateAverageResponseTime(groupSubmissions),
        averageScore: this.calculateAverageScore(groupSubmissions)
      };
    });

    return analysis;
  }

  /**
   * 약점 영역 식별
   * @param {Array} responses - 사용자 응답 배열
   * @param {Object} difficultyAnalysis - 난이도별 분석 결과
   * @param {Object} categoryAnalysis - 카테고리별 분석 결과
   * @returns {Array} 약점 영역 배열
   */
  static identifyWeakAreas(responses, difficultyAnalysis, categoryAnalysis) {
    const weakAreas = [];

    // 난이도별 약점 식별 (정확도 60% 미만)
    Object.keys(difficultyAnalysis).forEach(difficulty => {
      const analysis = difficultyAnalysis[difficulty];
      if (analysis.accuracy < 60 && analysis.totalQuestions >= 3) {
        weakAreas.push({
          type: 'difficulty',
          area: difficulty,
          accuracy: analysis.accuracy,
          issue: 'low_accuracy',
          severity: analysis.accuracy < 40 ? 'high' : 'medium'
        });
      }
    });

    // 카테고리별 약점 식별
    Object.keys(categoryAnalysis).forEach(category => {
      const analysis = categoryAnalysis[category];
      if (analysis.accuracy < 60 && analysis.totalQuestions >= 3) {
        weakAreas.push({
          type: 'category',
          area: category,
          accuracy: analysis.accuracy,
          issue: 'low_accuracy',
          severity: analysis.accuracy < 40 ? 'high' : 'medium'
        });
      }
    });

    // 응답 시간이 너무 긴 영역 식별
    const overallAvgTime = MetricsCalculator.calculateAverageResponseTime(responses);
    Object.keys(categoryAnalysis).forEach(category => {
      const analysis = categoryAnalysis[category];
      if (analysis.averageTime > overallAvgTime * 1.5 && analysis.totalQuestions >= 3) {
        weakAreas.push({
          type: 'category',
          area: category,
          averageTime: analysis.averageTime,
          issue: 'slow_response',
          severity: analysis.averageTime > overallAvgTime * 2 ? 'high' : 'medium'
        });
      }
    });

    return weakAreas.sort((a, b) => {
      const severityOrder = { high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }

  /**
   * 강점 영역 식별
   * @param {Array} responses - 사용자 응답 배열
   * @param {Object} difficultyAnalysis - 난이도별 분석 결과
   * @param {Object} categoryAnalysis - 카테고리별 분석 결과
   * @returns {Array} 강점 영역 배열
   */
  static identifyStrengths(responses, difficultyAnalysis, categoryAnalysis) {
    const strengths = [];

    // 난이도별 강점 식별 (정확도 80% 이상)
    Object.keys(difficultyAnalysis).forEach(difficulty => {
      const analysis = difficultyAnalysis[difficulty];
      if (analysis.accuracy >= 80 && analysis.totalQuestions >= 3) {
        strengths.push({
          type: 'difficulty',
          area: difficulty,
          accuracy: analysis.accuracy,
          strength: 'high_accuracy'
        });
      }
    });

    // 카테고리별 강점 식별
    Object.keys(categoryAnalysis).forEach(category => {
      const analysis = categoryAnalysis[category];
      if (analysis.accuracy >= 80 && analysis.totalQuestions >= 3) {
        strengths.push({
          type: 'category',
          area: category,
          accuracy: analysis.accuracy,
          strength: 'high_accuracy'
        });
      }
    });

    // 빠른 응답 시간 강점 식별
    const overallAvgTime = MetricsCalculator.calculateAverageResponseTime(responses);
    Object.keys(categoryAnalysis).forEach(category => {
      const analysis = categoryAnalysis[category];
      if (analysis.averageTime < overallAvgTime * 0.7 && analysis.accuracy >= 70) {
        strengths.push({
          type: 'category',
          area: category,
          averageTime: analysis.averageTime,
          strength: 'fast_response'
        });
      }
    });

    return strengths;
  }

  /**
   * 세션 시간 분석
   * @param {Object} session - 테스트 세션 객체
   * @param {Array} responses - 사용자 응답 배열
   * @returns {Object} 시간 분석 결과
   */
  static analyzeSessionTime(session, responses) {
    const startTime = new Date(session.start_time);
    const endTime = session.end_time ? new Date(session.end_time) : new Date();
    
    const totalSessionTime = endTime - startTime; // 밀리초
    const pauseDuration = session.pause_duration * 1000; // 초를 밀리초로 변환
    const totalActiveTime = totalSessionTime - pauseDuration;

    const responseTimeSum = responses.reduce((sum, r) => sum + (r.response_time || 0), 0);
    const thinkingTime = totalActiveTime - responseTimeSum;

    return {
      totalSessionTime: Math.round(totalSessionTime / 1000), // 초 단위
      totalActiveTime: Math.round(totalActiveTime / 1000),
      pauseDuration: session.pause_duration,
      responseTimeSum: Math.round(responseTimeSum / 1000),
      thinkingTime: Math.round(Math.max(0, thinkingTime) / 1000),
      averageTimePerQuestion: Math.round(totalActiveTime / responses.length / 1000)
    };
  }

  /**
   * 평균 점수 계산
   * @param {Array} submissions - 사용자 제출 배열
   * @returns {number} 평균 점수
   */
  static calculateAverageScore(submissions) {
    if (!submissions || submissions.length === 0) return 0;
    
    const totalScore = submissions.reduce((sum, s) => sum + (s.score || 0), 0);
    return Math.round((totalScore / submissions.length) * 100) / 100;
  }

  /**
   * 성과 리포트 생성
   * @param {number} sessionId - 테스트 세션 ID
   * @returns {Object} 성과 리포트
   */
  static async generatePerformanceReport(sessionId) {
    try {
      const analysis = await this.analyzeTestSession(sessionId);
      
      const report = {
        sessionId,
        userId: analysis.userId,
        reportGeneratedAt: new Date(),
        
        // 요약 정보
        summary: {
          overallScore: analysis.metrics.overallScore,
          level: this.determineLevelFromScore(analysis.metrics.overallScore),
          totalQuestions: analysis.summary.totalQuestions,
          correctAnswers: analysis.summary.correctAnswers,
          accuracyRate: analysis.metrics.accuracyRate
        },

        // 상세 메트릭
        detailedMetrics: analysis.metrics,

        // 주요 발견사항
        keyFindings: {
          strengths: analysis.patterns.strengths.slice(0, 3),
          weakAreas: analysis.patterns.weakAreas.slice(0, 3),
          trend: analysis.detailedAnalysis.trendAnalysis.trend
        },

        // 추천사항
        recommendations: this.generateRecommendations(analysis),

        // 원본 분석 데이터 (필요시 참조)
        fullAnalysis: analysis
      };

      return report;

    } catch (error) {
      console.error('Error generating performance report:', error);
      throw new Error(`Failed to generate performance report: ${error.message}`);
    }
  }

  /**
   * 점수 기반 레벨 결정
   * @param {number} score - 종합 점수
   * @returns {string} 레벨
   */
  static determineLevelFromScore(score) {
    if (score >= 71) return 'advanced';
    if (score >= 41) return 'intermediate';
    return 'beginner';
  }

  /**
   * 추천사항 생성
   * @param {Object} analysis - 분석 결과
   * @returns {Array} 추천사항 배열
   */
  static generateRecommendations(analysis) {
    const recommendations = [];
    const { weakAreas, strengths } = analysis.patterns;
    const { trendAnalysis } = analysis.detailedAnalysis;

    // 약점 기반 추천
    weakAreas.slice(0, 2).forEach(weakness => {
      if (weakness.issue === 'low_accuracy') {
        recommendations.push({
          type: 'improvement',
          priority: weakness.severity,
          area: weakness.area,
          suggestion: `${weakness.area} 영역의 정확도 향상을 위한 추가 학습이 필요합니다.`,
          action: `${weakness.area} 관련 기초 개념을 복습하고 연습 문제를 더 풀어보세요.`
        });
      } else if (weakness.issue === 'slow_response') {
        recommendations.push({
          type: 'improvement',
          priority: weakness.severity,
          area: weakness.area,
          suggestion: `${weakness.area} 영역에서 응답 속도 개선이 필요합니다.`,
          action: `시간 제한을 두고 ${weakness.area} 문제를 반복 연습해보세요.`
        });
      }
    });

    // 강점 기반 추천
    if (strengths.length > 0) {
      const topStrength = strengths[0];
      recommendations.push({
        type: 'strength',
        priority: 'medium',
        area: topStrength.area,
        suggestion: `${topStrength.area} 영역에서 뛰어난 실력을 보여주고 있습니다.`,
        action: `이 강점을 활용하여 더 어려운 ${topStrength.area} 문제에 도전해보세요.`
      });
    }

    // 트렌드 기반 추천
    if (trendAnalysis.trend === 'improving') {
      recommendations.push({
        type: 'encouragement',
        priority: 'low',
        suggestion: '테스트 진행 중 실력이 향상되고 있습니다.',
        action: '현재의 학습 방법을 유지하며 꾸준히 연습하세요.'
      });
    } else if (trendAnalysis.trend === 'declining') {
      recommendations.push({
        type: 'warning',
        priority: 'high',
        suggestion: '테스트 후반부에 성과가 하락했습니다.',
        action: '집중력 관리와 충분한 휴식을 취한 후 학습하세요.'
      });
    }

    return recommendations;
  }
}

module.exports = AnalysisService;