const express = require('express');
const router = express.Router();
const db = require('../models');
const { Op } = require('sequelize');

/**
 * GET /api/user-progress/recent-problems/:userId
 * 최근 풀었던 문제 조회
 */
router.get('/recent-problems/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit) || 3;
    
    console.log('[UserProgress] 최근 풀었던 문제 조회:', { userId, limit });
    
    const recentProblems = await db.StudySession.findAll({
      where: {
        user_id: userId,
        is_correct: {
          [Op.not]: null
        }
      },
      order: [['finished_at', 'DESC']],
      limit,
      attributes: [
        'id',
        'problem_id',
        'problem_title',
        'problem_type',
        'problem_description',
        'level',
        'language',
        'topic',
        'is_correct',
        'score',
        'blanks_correct',
        'blanks_total',
        'accuracy',
        'finished_at',
        'duration_ms'
      ]
    });
    
    res.json({
      success: true,
      data: recentProblems.map(p => ({
        id: p.id,
        problemId: p.problem_id,
        title: p.problem_title || `문제 ${p.problem_id || p.id}`,
        type: p.problem_type,
        description: p.problem_description,
        level: p.level,
        language: p.language,
        topic: p.topic,
        isCorrect: p.is_correct,
        score: p.score,
        blanksCorrect: p.blanks_correct,
        blanksTotal: p.blanks_total,
        accuracy: p.accuracy,
        finishedAt: p.finished_at,
        durationMs: p.duration_ms
      }))
    });
    
  } catch (error) {
    console.error('[UserProgress] 최근 문제 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '최근 문제 조회 중 오류가 발생했습니다',
      details: error.message
    });
  }
});

/**
 * GET /api/user-progress/stats/:userId
 * 학습 진도 통계 조회
 */
router.get('/stats/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log('[UserProgress] 학습 진도 통계 조회:', { userId });
    
    // 기본 통계 조회
    // problem_id가 null일 수 있으므로 COALESCE를 사용하여 id를 대체값으로 사용
    const stats = await db.sequelize.query(`
      SELECT 
        COUNT(DISTINCT CASE WHEN is_correct = 1 THEN COALESCE(problem_id, id) END) as solvedCount,
        COUNT(DISTINCT COALESCE(problem_id, id)) as attemptedCount,
        ROUND(AVG(CASE WHEN is_correct = 1 THEN 100 ELSE 0 END), 1) as successRate,
        ROUND(AVG(score), 1) as avgScore,
        COUNT(*) as totalAttempts,
        SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as totalCorrect
      FROM study_sessions
      WHERE user_id = :userId AND is_correct IS NOT NULL
    `, {
      replacements: { userId },
      type: db.sequelize.QueryTypes.SELECT
    });
    
    const basicStats = stats[0] || {
      solvedCount: 0,
      attemptedCount: 0,
      successRate: 0,
      avgScore: 0,
      totalAttempts: 0,
      totalCorrect: 0
    };
    
    // 레벨별 통계
    const levelStats = await db.StudySession.findAll({
      where: {
        user_id: userId,
        is_correct: {
          [Op.not]: null
        }
      },
      attributes: [
        'level',
        [db.sequelize.fn('COUNT', db.sequelize.col('*')), 'count'],
        [db.sequelize.fn('SUM', db.sequelize.literal('CASE WHEN is_correct = 1 THEN 1 ELSE 0 END')), 'correct']
      ],
      group: ['level'],
      order: [['level', 'ASC']]
    });
    
    // 문제 유형별 통계
    const typeStats = await db.StudySession.findAll({
      where: {
        user_id: userId,
        is_correct: {
          [Op.not]: null
        }
      },
      attributes: [
        'problem_type',
        [db.sequelize.fn('COUNT', db.sequelize.col('*')), 'count'],
        [db.sequelize.fn('SUM', db.sequelize.literal('CASE WHEN is_correct = 1 THEN 1 ELSE 0 END')), 'correct']
      ],
      group: ['problem_type'],
      order: [[db.sequelize.fn('COUNT', db.sequelize.col('*')), 'DESC']]
    });
    
    res.json({
      success: true,
      data: {
        basic: {
          solvedProblems: parseInt(basicStats.solvedCount) || 0,
          attemptedProblems: parseInt(basicStats.attemptedCount) || 0,
          successRate: parseFloat(basicStats.successRate) || 0,
          averageScore: parseFloat(basicStats.avgScore) || 0,
          totalAttempts: parseInt(basicStats.totalAttempts) || 0,
          totalCorrect: parseInt(basicStats.totalCorrect) || 0
        },
        byLevel: levelStats.map(stat => ({
          level: stat.level,
          total: parseInt(stat.dataValues.count),
          correct: parseInt(stat.dataValues.correct) || 0,
          successRate: parseInt(stat.dataValues.count) > 0 
            ? Math.round((parseInt(stat.dataValues.correct) / parseInt(stat.dataValues.count)) * 100)
            : 0
        })),
        byType: typeStats.map(stat => ({
          type: stat.problem_type,
          total: parseInt(stat.dataValues.count),
          correct: parseInt(stat.dataValues.correct) || 0,
          successRate: parseInt(stat.dataValues.count) > 0 
            ? Math.round((parseInt(stat.dataValues.correct) / parseInt(stat.dataValues.count)) * 100)
            : 0
        }))
      }
    });
    
  } catch (error) {
    console.error('[UserProgress] 학습 진도 통계 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '학습 진도 통계 조회 중 오류가 발생했습니다',
      details: error.message
    });
  }
});

module.exports = router;

