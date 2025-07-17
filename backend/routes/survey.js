const express = require('express');
const { body, validationResult } = require('express-validator');
const { query, transaction } = require('../config/database');

const router = express.Router();

// 설문조사 유효성 검사 규칙
const surveyValidation = [
  body('occupation')
    .notEmpty()
    .withMessage('직업을 선택해주세요')
    .isIn(['developer', 'student', 'job-seeker', 'employee', 'freelancer', 'other'])
    .withMessage('유효하지 않은 직업 유형입니다'),
  
  body('purpose')
    .notEmpty()
    .withMessage('학습 목적을 선택해주세요')
    .isIn(['job-prep', 'skill-improvement', 'coding-test', 'new-tech', 'portfolio', 'other'])
    .withMessage('유효하지 않은 학습 목적입니다'),
  
  body('level')
    .notEmpty()
    .withMessage('현재 레벨을 선택해주세요')
    .isIn(['beginner', 'intermediate', 'advanced', 'expert'])
    .withMessage('유효하지 않은 레벨입니다'),
  
  body('motivation')
    .notEmpty()
    .withMessage('가입 동기를 입력해주세요')
    .isLength({ min: 10, max: 500 })
    .withMessage('가입 동기는 10자 이상 500자 이하로 입력해주세요'),
  
  body('userId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('유효하지 않은 사용자 ID입니다')
];

// POST /api/survey - 설문조사 결과 저장
router.post('/', surveyValidation, async (req, res) => {
  try {
    // 유효성 검사 결과 확인
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '입력 데이터가 유효하지 않습니다',
        errors: errors.array()
      });
    }

    const { occupation, purpose, level, motivation, userId } = req.body;

    // 설문조사 결과 저장
    const result = await transaction(async (connection) => {
      // 설문조사 기본 정보 저장
      const [surveyResult] = await connection.execute(
        `INSERT INTO user_surveys 
         (user_id, occupation, purpose, level, motivation, completed_at, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, NOW(), NOW(), NOW())`,
        [userId || null, occupation, purpose, level, motivation]
      );

      const surveyId = surveyResult.insertId;

      // 사용자 프로필에 설문조사 완료 표시 (사용자가 있는 경우)
      if (userId) {
        await connection.execute(
          `UPDATE users 
           SET survey_completed = 1, updated_at = NOW() 
           WHERE id = ?`,
          [userId]
        );
      }

      return { surveyId };
    });

    res.status(201).json({
      success: true,
      message: '설문조사가 성공적으로 저장되었습니다',
      data: {
        surveyId: result.surveyId,
        submittedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Survey submission error:', error);
    res.status(500).json({
      success: false,
      message: '설문조사 저장 중 오류가 발생했습니다',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/survey/:surveyId - 특정 설문조사 결과 조회
router.get('/:surveyId', async (req, res) => {
  try {
    const { surveyId } = req.params;

    const survey = await query(
      `SELECT id, user_id, occupation, purpose, level, motivation, 
              completed_at, created_at, updated_at 
       FROM user_surveys 
       WHERE id = ?`,
      [surveyId]
    );

    if (survey.length === 0) {
      return res.status(404).json({
        success: false,
        message: '설문조사 결과를 찾을 수 없습니다'
      });
    }

    res.json({
      success: true,
      data: survey[0]
    });

  } catch (error) {
    console.error('Survey retrieval error:', error);
    res.status(500).json({
      success: false,
      message: '설문조사 조회 중 오류가 발생했습니다',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/survey/user/:userId - 사용자별 설문조사 결과 조회
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const surveys = await query(
      `SELECT id, occupation, purpose, level, motivation, 
              completed_at, created_at, updated_at 
       FROM user_surveys 
       WHERE user_id = ? 
       ORDER BY completed_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      data: surveys,
      count: surveys.length
    });

  } catch (error) {
    console.error('User surveys retrieval error:', error);
    res.status(500).json({
      success: false,
      message: '사용자 설문조사 조회 중 오류가 발생했습니다',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/survey/stats/summary - 설문조사 통계 조회
router.get('/stats/summary', async (req, res) => {
  try {
    const stats = await query(`
      SELECT 
        COUNT(*) as total_surveys,
        COUNT(DISTINCT user_id) as unique_users,
        AVG(CHAR_LENGTH(motivation)) as avg_motivation_length,
        occupation,
        COUNT(*) as occupation_count
      FROM user_surveys 
      GROUP BY occupation
      ORDER BY occupation_count DESC
    `);

    const purposeStats = await query(`
      SELECT purpose, COUNT(*) as count 
      FROM user_surveys 
      GROUP BY purpose 
      ORDER BY count DESC
    `);

    const levelStats = await query(`
      SELECT level, COUNT(*) as count 
      FROM user_surveys 
      GROUP BY level 
      ORDER BY 
        CASE level 
          WHEN 'beginner' THEN 1 
          WHEN 'intermediate' THEN 2 
          WHEN 'advanced' THEN 3 
          WHEN 'expert' THEN 4 
        END
    `);

    res.json({
      success: true,
      data: {
        overview: stats[0] || { total_surveys: 0, unique_users: 0, avg_motivation_length: 0 },
        occupationDistribution: stats,
        purposeDistribution: purposeStats,
        levelDistribution: levelStats
      }
    });

  } catch (error) {
    console.error('Survey stats error:', error);
    res.status(500).json({
      success: false,
      message: '설문조사 통계 조회 중 오류가 발생했습니다',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router; 