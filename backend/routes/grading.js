const express = require('express');
const router = express.Router();
const GradingSystem = require('../services/gradingSystem');
const GradingResultService = require('../services/gradingResultService');
const UserExperienceService = require('../services/userExperienceService');

/**
 * POST /api/grading/grade
 * 문제 채점 API
 */
router.post('/grade', async (req, res) => {
  try {
    console.log('[Grading API] 채점 요청 받음');
    console.log('[Grading API] 요청 데이터:', {
      problemType: req.body.problemType,
      problemId: req.body.problemId,
      hasUserAnswer: !!req.body.userAnswer
    });
    
    const { problemType, problem, userAnswer, level } = req.body;
    
    // 필수 데이터 검증
    if (!problemType || !problem || !userAnswer) {
      return res.status(400).json({
        success: false,
        error: '필수 데이터가 누락되었습니다 (problemType, problem, userAnswer)'
      });
    }
    
    // 채점 실행
    const gradingResult = GradingSystem.grade(problemType, problem, userAnswer);
    
    // 레벨별 조정 적용
    const finalResult = level !== undefined 
      ? GradingSystem.adjustGradingByLevel(level, gradingResult)
      : gradingResult;
    
    // 결과에 메타데이터 추가
    const response = {
      ...finalResult,
      timestamp: new Date().toISOString(),
      problemId: problem.id || req.body.problemId,
      level: level || problem.level || 0
    };
    
    // 채점 결과를 데이터베이스에 저장
    if (response.success && req.body.userId) {
      try {
        const saveData = {
          userId: req.body.userId,
          problemId: problem.id || req.body.problemId,
          problemType: problemType,
          level: level || problem.level || 0,
          problemTitle: problem.title,
          problemDescription: problem.description,
          userAnswer: userAnswer,
          gradingResult: response,
          score: response.score,
          isCorrect: response.isCorrect,
          correctCount: response.correctCount,
          totalCount: response.totalCount,
          feedback: response.feedback,
          timeSpent: req.body.timeSpent,
          language: problem.language || 'javascript',
          topic: problem.topic || 'programming'
        };
        
        const saveResult = await GradingResultService.saveGradingResult(saveData);
        response.sessionId = saveResult.sessionId;
        response.attemptCount = saveResult.attemptCount;
        response.isFirstAttempt = saveResult.isFirstAttempt;
        
        console.log('[Grading API] 채점 결과 저장 완료:', {
          sessionId: saveResult.sessionId,
          attemptCount: saveResult.attemptCount
        });

        // 경험치 추가
        console.log('[Grading API] 경험치 추가 시도:', {
          userId: req.body.userId,
          hasUserId: !!req.body.userId,
          level: level || problem.level || 0,
          problemType: problemType,
          score: response.score
        });
        
        try {
          if (!req.body.userId) {
            console.warn('[Grading API] userId가 없어서 경험치를 추가할 수 없습니다');
          } else {
            const experienceData = {
              level: level || problem.level || 0,
              problemType: problemType,
              score: response.score,
              isCorrect: response.isCorrect,
              isFirstAttempt: saveResult.isFirstAttempt,
              timeSpent: req.body.timeSpent || 0
            };

            const experienceResult = await UserExperienceService.addExperienceFromProblem(req.body.userId, experienceData);
            
            console.log('[Grading API] 경험치 추가 결과:', experienceResult);
            
            if (experienceResult.success) {
              response.experience = {
                gained: experienceResult.data.gainedExperience,
                leveledUp: experienceResult.data.leveledUp,
                newLevel: experienceResult.data.level,
                levelUpReward: experienceResult.data.levelUpReward
              };
              
              console.log('[Grading API] 경험치 추가 완료:', {
                gained: experienceResult.data.gainedExperience,
                leveledUp: experienceResult.data.leveledUp,
                newLevel: experienceResult.data.level
              });
            } else {
              console.error('[Grading API] 경험치 추가 실패 (success: false):', experienceResult.error);
            }
          }
        } catch (expError) {
          console.error('[Grading API] 경험치 추가 예외:', expError);
          console.error('[Grading API] 스택 트레이스:', expError.stack);
          // 경험치 추가 실패는 채점 결과에 영향을 주지 않음
        }
        
      } catch (saveError) {
        console.error('[Grading API] 채점 결과 저장 실패:', saveError);
        // 저장 실패해도 채점 결과는 반환
      }
    }
    
    console.log('[Grading API] 채점 완료:', {
      success: response.success,
      score: response.score,
      isCorrect: response.isCorrect
    });
    
    res.json(response);
    
  } catch (error) {
    console.error('[Grading API] 채점 오류:', error);
    res.status(500).json({
      success: false,
      error: '채점 중 오류가 발생했습니다',
      details: error.message
    });
  }
});

/**
 * POST /api/grading/validate-code
 * 코드 검증 API (추가 기능)
 */
router.post('/validate-code', async (req, res) => {
  try {
    const { code, language = 'javascript' } = req.body;
    
    if (!code) {
      return res.status(400).json({
        success: false,
        error: '코드가 제공되지 않았습니다'
      });
    }
    
    // 코드 검증 실행
    const validation = GradingSystem.validateGeneratedCode(code);
    
    res.json({
      success: true,
      validation,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[Grading API] 코드 검증 오류:', error);
    res.status(500).json({
      success: false,
      error: '코드 검증 중 오류가 발생했습니다',
      details: error.message
    });
  }
});

/**
 * GET /api/grading/user-history/:userId
 * 사용자 문제 풀이 기록 조회
 */
router.get('/user-history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      problemType,
      level,
      isCorrect,
      limit = 50,
      offset = 0,
      startDate,
      endDate
    } = req.query;
    
    console.log('[Grading API] 사용자 풀이 기록 조회:', { userId, query: req.query });
    
    const options = {
      problemType,
      level: level ? parseInt(level) : undefined,
      isCorrect: isCorrect ? isCorrect === 'true' : undefined,
      limit: parseInt(limit),
      offset: parseInt(offset),
      startDate,
      endDate
    };
    
    const result = await GradingResultService.getUserProblemHistory(userId, options);
    
    res.json(result);
    
  } catch (error) {
    console.error('[Grading API] 사용자 풀이 기록 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '풀이 기록 조회 중 오류가 발생했습니다',
      details: error.message
    });
  }
});

/**
 * GET /api/grading/user-stats/:userId
 * 사용자 통계 조회
 */
router.get('/user-stats/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { problemType, level } = req.query;
    
    console.log('[Grading API] 사용자 통계 조회:', { userId, query: req.query });
    
    const options = {
      problemType,
      level: level ? parseInt(level) : undefined
    };
    
    const stats = await GradingResultService.calculateUserStats(userId, options);
    
    res.json({
      success: true,
      stats
    });
    
  } catch (error) {
    console.error('[Grading API] 사용자 통계 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '통계 조회 중 오류가 발생했습니다',
      details: error.message
    });
  }
});

/**
 * GET /api/grading/user-progress/:userId
 * 사용자 레벨별 성취도 조회
 */
router.get('/user-progress/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log('[Grading API] 레벨별 성취도 조회:', { userId });
    
    const result = await GradingResultService.getUserLevelProgress(userId);
    
    res.json(result);
    
  } catch (error) {
    console.error('[Grading API] 레벨별 성취도 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '성취도 조회 중 오류가 발생했습니다',
      details: error.message
    });
  }
});

/**
 * GET /api/grading/problem-history/:problemId
 * 문제별 풀이 기록 조회
 */
router.get('/problem-history/:problemId', async (req, res) => {
  try {
    const { problemId } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    
    console.log('[Grading API] 문제별 풀이 기록 조회:', { problemId, query: req.query });
    
    const options = {
      limit: parseInt(limit),
      offset: parseInt(offset)
    };
    
    const result = await GradingResultService.getProblemHistory(problemId, options);
    
    res.json(result);
    
  } catch (error) {
    console.error('[Grading API] 문제별 풀이 기록 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '문제별 풀이 기록 조회 중 오류가 발생했습니다',
      details: error.message
    });
  }
});

/**
 * GET /api/grading/health
 * 채점 시스템 상태 확인
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: '채점 시스템이 정상 작동 중입니다',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

module.exports = router;
