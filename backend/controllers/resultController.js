// backend/controllers/resultController.js
const AnalysisService = require('../services/analysisService');
const LevelService = require('../services/levelService');
const db = require('../models');

/**
 * 테스트 결과 관련 API 컨트롤러
 */
class ResultController {

  /**
   * 사용자 분석 결과 조회
   * GET /api/results/analysis/:userId
   */
  static async getUserAnalysis(req, res) {
    try {
      const { userId } = req.params;
      const { days = 30, problemType = 'level_test' } = req.query;
      const requestUserId = req.user?.user_id;

      // 권한 확인
      if (requestUserId && parseInt(userId) !== requestUserId) {
        return res.status(403).json({
          error: 'ACCESS_DENIED',
          message: 'You can only access your own analysis results'
        });
      }

      // 분석 옵션 설정
      const analysisOptions = {
        startDate: new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000),
        problemType,
        limit: 100
      };

      // 사용자 분석 수행
      const analysis = await AnalysisService.analyzeUserSubmissions(userId, analysisOptions);

      if (analysis.status === 'no_submissions') {
        return res.status(404).json({
          error: 'RESOURCE_NOT_FOUND',
          message: 'No submissions found for analysis',
          details: { 
            resource_type: 'submissions', 
            user_id: userId,
            analysis_period: `${days} days`
          }
        });
      }

      // 사용자 정보 조회
      const user = await db.User.findByPk(userId, {
        attributes: ['user_id', 'username', 'current_level']
      });

      // 응답 데이터 구성
      const responseData = {
        userId: parseInt(userId),
        username: user?.username,
        currentLevel: user?.current_level,
        analysisOptions,
        
        // 기본 메트릭
        metrics: analysis.metrics,

        // 상세 분석
        detailedAnalysis: analysis.detailedAnalysis,

        // 패턴 분석
        patterns: analysis.patterns,

        // 요약 정보
        summary: analysis.summary,

        analysisTimestamp: analysis.analysisTimestamp
      };

      res.json({
        success: true,
        data: responseData
      });

    } catch (error) {
      console.error('Error getting test result:', error);
      res.status(500).json({
        error: 'SYSTEM_ERROR',
        message: 'Failed to retrieve test result',
        details: { operation: 'get_test_result', retry_possible: true }
      });
    }
  }

  /**
   * 사용자 제출 이력 조회
   * GET /api/results/history/:userId
   */
  static async getUserSubmissionHistory(req, res) {
    try {
      const { userId } = req.params;
      const { limit = 20, offset = 0, problemType, difficulty } = req.query;
      const requestUserId = req.user?.user_id;

      // 권한 확인
      if (requestUserId && parseInt(userId) !== requestUserId) {
        return res.status(403).json({
          error: 'ACCESS_DENIED',
          message: 'You can only access your own submission history'
        });
      }

      // 쿼리 조건 구성
      const whereCondition = { user_id: userId };
      const problemWhereCondition = {};
      
      if (problemType) problemWhereCondition.problem_type = problemType;
      if (difficulty) problemWhereCondition.difficulty = difficulty;

      // 제출 이력 조회
      const { count, rows: submissions } = await db.Submission.findAndCountAll({
        where: whereCondition,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['submitted_at', 'DESC']],
        include: [
          {
            model: db.Problem,
            as: 'problem',
            where: Object.keys(problemWhereCondition).length > 0 ? problemWhereCondition : undefined,
            attributes: ['problem_id', 'title', 'difficulty', 'category', 'level', 'problem_type']
          }
        ]
      });

      // 응답 데이터 구성
      const historyData = submissions.map(submission => ({
        submissionId: submission.submission_id,
        problemId: submission.problem_id,
        problemTitle: submission.problem?.title,
        problemType: submission.problem?.problem_type,
        difficulty: submission.problem?.difficulty,
        category: submission.problem?.category,
        result: submission.result,
        score: submission.score,
        executionTime: submission.execution_time_ms,
        submittedAt: submission.submitted_at,
        errorMessage: submission.error_message
      }));

      // 통계 정보 계산
      const statistics = this.calculateSubmissionStatistics(submissions);

      res.json({
        success: true,
        data: {
          userId: parseInt(userId),
          totalSubmissions: count,
          currentPage: Math.floor(offset / limit) + 1,
          totalPages: Math.ceil(count / limit),
          history: historyData,
          statistics
        }
      });

    } catch (error) {
      console.error('Error getting user test history:', error);
      res.status(500).json({
        error: 'SYSTEM_ERROR',
        message: 'Failed to retrieve test history',
        details: { operation: 'get_test_history', retry_possible: true }
      });
    }
  }

  /**
   * 실시간 분석 결과 조회
   * GET /api/analysis/session/:sessionId
   */
  static async getSessionAnalysis(req, res) {
    try {
      const { sessionId } = req.params;
      const userId = req.user?.user_id;

      if (!sessionId) {
        return res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'Session ID is required'
        });
      }

      // 세션 권한 확인
      const session = await db.TestSession.findByPk(sessionId, {
        attributes: ['session_id', 'user_id', 'status']
      });

      if (!session) {
        return res.status(404).json({
          error: 'RESOURCE_NOT_FOUND',
          message: 'Test session not found',
          details: { resource_type: 'test_session', session_id: sessionId }
        });
      }

      if (userId && session.user_id !== userId) {
        return res.status(403).json({
          error: 'ACCESS_DENIED',
          message: 'You can only access your own test sessions'
        });
      }

      // 실시간 분석 수행
      const analysis = await AnalysisService.analyzeTestSession(sessionId);

      res.json({
        success: true,
        data: {
          sessionId,
          analysisTimestamp: new Date(),
          sessionStatus: session.status,
          analysis
        }
      });

    } catch (error) {
      console.error('Error getting session analysis:', error);
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          error: 'RESOURCE_NOT_FOUND',
          message: error.message
        });
      }

      res.status(500).json({
        error: 'SYSTEM_ERROR',
        message: 'Failed to analyze test session',
        details: { operation: 'analyze_session', retry_possible: true }
      });
    }
  }

  /**
   * 성과 리포트 생성
   * GET /api/results/report/:sessionId
   */
  static async generatePerformanceReport(req, res) {
    try {
      const { sessionId } = req.params;
      const userId = req.user?.user_id;

      // 권한 확인
      const session = await db.TestSession.findByPk(sessionId, {
        attributes: ['session_id', 'user_id', 'status']
      });

      if (!session) {
        return res.status(404).json({
          error: 'RESOURCE_NOT_FOUND',
          message: 'Test session not found'
        });
      }

      if (userId && session.user_id !== userId) {
        return res.status(403).json({
          error: 'ACCESS_DENIED',
          message: 'You can only access your own performance reports'
        });
      }

      // 성과 리포트 생성
      const report = await AnalysisService.generatePerformanceReport(sessionId);

      res.json({
        success: true,
        data: report
      });

    } catch (error) {
      console.error('Error generating performance report:', error);
      res.status(500).json({
        error: 'SYSTEM_ERROR',
        message: 'Failed to generate performance report',
        details: { operation: 'generate_report', retry_possible: true }
      });
    }
  }

  /**
   * 레벨 배정 수행
   * POST /api/results/assign-level
   */
  static async assignLevel(req, res) {
    try {
      const { sessionId } = req.body;
      const userId = req.user?.user_id;

      if (!sessionId) {
        return res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'Session ID is required',
          details: { field: 'sessionId', issue: 'Session ID must be provided in request body' }
        });
      }

      // 세션 확인 및 권한 검증
      const session = await db.TestSession.findByPk(sessionId, {
        attributes: ['session_id', 'user_id', 'status']
      });

      if (!session) {
        return res.status(404).json({
          error: 'RESOURCE_NOT_FOUND',
          message: 'Test session not found'
        });
      }

      if (userId && session.user_id !== userId) {
        return res.status(403).json({
          error: 'ACCESS_DENIED',
          message: 'You can only assign levels for your own test sessions'
        });
      }

      // 세션이 완료되었는지 확인
      if (session.status !== 'completed') {
        return res.status(422).json({
          error: 'BUSINESS_LOGIC_ERROR',
          message: 'Cannot assign level for incomplete test session',
          details: {
            current_status: session.status,
            required_status: 'completed'
          }
        });
      }

      // 이미 레벨이 배정되었는지 확인
      const existingResult = await db.TestResult.findOne({
        where: { session_id: sessionId }
      });

      if (existingResult) {
        return res.status(422).json({
          error: 'BUSINESS_LOGIC_ERROR',
          message: 'Level already assigned for this session',
          details: {
            existing_level: existingResult.assigned_level,
            result_id: existingResult.result_id
          }
        });
      }

      // 레벨 배정 수행
      const levelAssignmentResult = await LevelService.assignLevel(session.user_id, sessionId);

      res.status(201).json({
        success: true,
        message: 'Level assigned successfully',
        data: levelAssignmentResult
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
   * 테스트 지속 시간 계산
   * @param {Date} startTime - 시작 시간
   * @param {Date} endTime - 종료 시간
   * @returns {number} 지속 시간 (분)
   */
  static calculateTestDuration(startTime, endTime) {
    if (!startTime || !endTime) return null;
    
    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationMs = end - start;
    
    return Math.round(durationMs / (1000 * 60)); // 분 단위
  }

  /**
   * 제출 이력 통계 계산
   * @param {Array} submissions - 제출 기록 배열
   * @returns {Object} 통계 정보
   */
  static calculateSubmissionStatistics(submissions) {
    if (!submissions || submissions.length === 0) {
      return {
        averageScore: 0,
        bestScore: 0,
        accuracy: 0,
        totalSubmissions: 0,
        difficultyDistribution: {},
        resultDistribution: {}
      };
    }

    const scores = submissions.map(s => s.score);
    const results = submissions.map(s => s.result);
    const difficulties = submissions.map(s => s.problem?.difficulty).filter(d => d);

    // 평균 점수
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    
    // 최고 점수
    const bestScore = Math.max(...scores);
    
    // 정확도
    const correctSubmissions = submissions.filter(s => s.result === 'correct').length;
    const accuracy = (correctSubmissions / submissions.length) * 100;

    // 난이도 분포
    const difficultyDistribution = difficulties.reduce((dist, difficulty) => {
      dist[difficulty] = (dist[difficulty] || 0) + 1;
      return dist;
    }, {});

    // 결과 분포
    const resultDistribution = results.reduce((dist, result) => {
      dist[result] = (dist[result] || 0) + 1;
      return dist;
    }, {});

    // 개선 트렌드 (최근 절반 vs 이전 절반)
    let improvementTrend = 'stable';
    if (submissions.length >= 10) {
      const midPoint = Math.floor(submissions.length / 2);
      const recentScores = scores.slice(0, midPoint);
      const previousScores = scores.slice(midPoint);
      
      const recentAvg = recentScores.reduce((sum, score) => sum + score, 0) / recentScores.length;
      const previousAvg = previousScores.reduce((sum, score) => sum + score, 0) / previousScores.length;
      
      const improvement = recentAvg - previousAvg;
      
      if (improvement > 5) improvementTrend = 'improving';
      else if (improvement < -5) improvementTrend = 'declining';
    }

    return {
      averageScore: Math.round(averageScore * 100) / 100,
      bestScore,
      accuracy: Math.round(accuracy * 100) / 100,
      totalSubmissions: submissions.length,
      difficultyDistribution,
      resultDistribution,
      improvementTrend
    };
  }
}

module.exports = ResultController;