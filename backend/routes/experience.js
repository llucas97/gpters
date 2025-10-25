const express = require('express');
const router = express.Router();
const UserExperienceService = require('../services/userExperienceService');
const ExperienceSystem = require('../services/experienceSystem');

/**
 * GET /api/experience/:userId
 * 사용자 경험치 정보 조회
 */
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log('[Experience API] 사용자 경험치 정보 조회:', { userId });
    
    const result = await UserExperienceService.getUserExperience(userId);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
    
  } catch (error) {
    console.error('[Experience API] 경험치 정보 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '경험치 정보 조회 중 오류가 발생했습니다',
      details: error.message
    });
  }
});

/**
 * POST /api/experience/:userId/add
 * 문제 해결 후 경험치 추가
 */
router.post('/:userId/add', async (req, res) => {
  try {
    const { userId } = req.params;
    const problemData = req.body;
    
    console.log('[Experience API] 경험치 추가 요청:', { userId, problemData });
    
    // 필수 데이터 검증
    if (!problemData.level && problemData.level !== 0) {
      return res.status(400).json({
        success: false,
        error: '문제 레벨이 필요합니다'
      });
    }
    
    const result = await UserExperienceService.addExperienceFromProblem(userId, problemData);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
    
  } catch (error) {
    console.error('[Experience API] 경험치 추가 오류:', error);
    res.status(500).json({
      success: false,
      error: '경험치 추가 중 오류가 발생했습니다',
      details: error.message
    });
  }
});

/**
 * GET /api/experience/:userId/stats
 * 사용자 경험치 통계 조회
 */
router.get('/:userId/stats', async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log('[Experience API] 사용자 경험치 통계 조회:', { userId });
    
    const result = await UserExperienceService.getUserExperienceStats(userId);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
    
  } catch (error) {
    console.error('[Experience API] 경험치 통계 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '경험치 통계 조회 중 오류가 발생했습니다',
      details: error.message
    });
  }
});

/**
 * GET /api/experience/ranking
 * 레벨 순위 조회
 */
router.get('/ranking', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    console.log('[Experience API] 레벨 순위 조회:', { limit });
    
    const result = await UserExperienceService.getLevelRanking(parseInt(limit));
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
    
  } catch (error) {
    console.error('[Experience API] 레벨 순위 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '레벨 순위 조회 중 오류가 발생했습니다',
      details: error.message
    });
  }
});

/**
 * GET /api/experience/level/:level
 * 특정 레벨 정보 조회
 */
router.get('/level/:level', async (req, res) => {
  try {
    const { level } = req.params;
    const levelNum = parseInt(level);
    
    console.log('[Experience API] 레벨 정보 조회:', { level: levelNum });
    
    const maxExp = ExperienceSystem.calculateMaxExperience(levelNum);
    const expToNext = ExperienceSystem.calculateExperienceToNextLevel(levelNum);
    const nextLevelMaxExp = ExperienceSystem.calculateMaxExperience(levelNum + 1);
    
    res.json({
      success: true,
      data: {
        level: levelNum,
        maxExperience: maxExp,
        experienceToNext: expToNext,
        nextLevelMaxExperience: nextLevelMaxExp,
        levelUpReward: ExperienceSystem.calculateLevelUpReward(levelNum)
      }
    });
    
  } catch (error) {
    console.error('[Experience API] 레벨 정보 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '레벨 정보 조회 중 오류가 발생했습니다',
      details: error.message
    });
  }
});

/**
 * POST /api/experience/:userId/reset
 * 사용자 경험치 리셋 (관리자용)
 */
router.post('/:userId/reset', async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log('[Experience API] 경험치 리셋 요청:', { userId });
    
    const result = await UserExperienceService.resetUserExperience(userId);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
    
  } catch (error) {
    console.error('[Experience API] 경험치 리셋 오류:', error);
    res.status(500).json({
      success: false,
      error: '경험치 리셋 중 오류가 발생했습니다',
      details: error.message
    });
  }
});

/**
 * GET /api/experience/calculate
 * 경험치 계산 시뮬레이션
 */
router.get('/calculate', async (req, res) => {
  try {
    const { level, problemType, score, isCorrect, isFirstAttempt, timeSpent } = req.query;
    
    console.log('[Experience API] 경험치 계산 시뮬레이션:', req.query);
    
    const problemData = {
      level: parseInt(level) || 0,
      problemType: problemType || 'cloze',
      score: parseInt(score) || 0,
      isCorrect: isCorrect === 'true',
      isFirstAttempt: isFirstAttempt === 'true',
      timeSpent: parseInt(timeSpent) || 0
    };
    
    const gainedExp = ExperienceSystem.calculateExperienceGain(problemData);
    
    res.json({
      success: true,
      data: {
        problemData,
        gainedExperience: gainedExp,
        calculation: {
          baseExp: 10 + (problemData.level * 5),
          multipliers: {
            correct: problemData.isCorrect ? 1.5 : 0.3,
            score: problemData.score >= 90 ? 1.2 : problemData.score >= 80 ? 1.1 : 1.0,
            firstAttempt: problemData.isFirstAttempt && problemData.isCorrect ? 1.3 : 1.0,
            type: {
              'block': 1.0,
              'cloze': 1.1,
              'code_editor': 1.3,
              'ordering': 1.2,
              'bug_fix': 1.4
            }[problemData.problemType] || 1.0,
            time: problemData.timeSpent > 0 ? Math.max(0.8, 1.0 - (problemData.timeSpent / 300000)) : 1.0
          }
        }
      }
    });
    
  } catch (error) {
    console.error('[Experience API] 경험치 계산 시뮬레이션 오류:', error);
    res.status(500).json({
      success: false,
      error: '경험치 계산 중 오류가 발생했습니다',
      details: error.message
    });
  }
});

module.exports = router;
