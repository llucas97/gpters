const express = require('express');
const router = express.Router();
const { User, Problem } = require('../models');
const isAuthenticated = require('../middlewares/isAuthenticated');

// 레벨테스트 결과 저장
router.post('/', isAuthenticated, async (req, res) => {
  try {
    const { level, score, totalQuestions, correctAnswers, answers } = req.body;
    const userId = req.user.id;

    // 사용자 레벨 업데이트
    await User.update(
      { 
        level: level,
        level_test_score: score,
        level_test_completed: true,
        level_test_date: new Date()
      },
      { where: { id: userId } }
    );

    // 레벨테스트 결과 로그 저장 (선택사항)
    console.log(`User ${userId} completed level test: Level ${level}, Score: ${score}/${totalQuestions}`);

    res.json({
      success: true,
      message: '레벨테스트 결과가 저장되었습니다.',
      data: {
        level: level,
        score: score,
        totalQuestions: totalQuestions,
        correctAnswers: correctAnswers
      }
    });

  } catch (error) {
    console.error('Level test save error:', error);
    res.status(500).json({
      success: false,
      message: '레벨테스트 결과 저장 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// 사용자 레벨 정보 조회
router.get('/user-level', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await User.findByPk(userId, {
      attributes: ['id', 'username', 'level', 'level_test_score', 'level_test_completed', 'level_test_date']
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다.'
      });
    }

    res.json({
      success: true,
      data: {
        level: user.level || 0,
        score: user.level_test_score || 0,
        completed: user.level_test_completed || false,
        testDate: user.level_test_date
      }
    });

  } catch (error) {
    console.error('User level fetch error:', error);
    res.status(500).json({
      success: false,
      message: '사용자 레벨 정보 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// 레벨별 문제 목록 조회
router.get('/problems/:level', async (req, res) => {
  try {
    const { level } = req.params;
    const levelNum = parseInt(level);

    if (isNaN(levelNum) || levelNum < 0 || levelNum > 5) {
      return res.status(400).json({
        success: false,
        message: '유효하지 않은 레벨입니다. (0-5 사이의 숫자)'
      });
    }

    const levelNames = ['beginner', 'easy', 'medium', 'hard', 'expert'];
    const difficultyLevel = levelNames[levelNum] || 'easy';

    const problems = await Problem.findAll({
      where: { difficulty_level: difficultyLevel },
      attributes: ['problem_id', 'title', 'description', 'difficulty_level', 'category'],
      limit: 10,
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        level: levelNum,
        difficulty: difficultyLevel,
        problems: problems
      }
    });

  } catch (error) {
    console.error('Problems fetch error:', error);
    res.status(500).json({
      success: false,
      message: '문제 목록 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// 레벨테스트 통계 조회 (관리자용)
router.get('/stats', isAuthenticated, async (req, res) => {
  try {
    // 관리자 권한 확인 (선택사항)
    // if (req.user.role !== 'admin') {
    //   return res.status(403).json({
    //     success: false,
    //     message: '관리자 권한이 필요합니다.'
    //   });
    // }

    const stats = await User.findAll({
      attributes: [
        'level',
        [User.sequelize.fn('COUNT', User.sequelize.col('id')), 'count']
      ],
      where: { level_test_completed: true },
      group: ['level'],
      order: [['level', 'ASC']]
    });

    const totalUsers = await User.count({
      where: { level_test_completed: true }
    });

    res.json({
      success: true,
      data: {
        totalUsers: totalUsers,
        levelDistribution: stats
      }
    });

  } catch (error) {
    console.error('Level test stats error:', error);
    res.status(500).json({
      success: false,
      message: '레벨테스트 통계 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

module.exports = router;
