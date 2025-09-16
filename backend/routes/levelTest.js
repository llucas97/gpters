const express = require('express');
const router = express.Router();
const db = require('../models');

// 로그인 여부 확인 미들웨어
const isAuthenticated = (req, res, next) => {
  console.log('🔍 레벨테스트 인증 확인 중...');
  console.log('📌 req.isAuthenticated():', req.isAuthenticated());
  console.log('📌 req.user:', req.user);
  
  if (req.isAuthenticated()) return next();
  return res.status(401).json({ success: false, message: '로그인이 필요합니다.' });
};

// 테스트용 엔드포인트
router.get('/test', async (req, res) => {
  try {
    return res.status(200).json({ 
      success: true, 
      message: '레벨테스트 API가 정상적으로 작동합니다.',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    return res.status(500).json({ 
      success: false, 
      message: '서버 오류가 발생했습니다.', 
      error: err.message 
    });
  }
});

// 레벨테스트 결과 저장
router.post('/submit', isAuthenticated, async (req, res) => {
  try {
    console.log('📨 레벨테스트 결과 저장 요청');
    console.log('📌 로그인된 사용자:', req.user.user_id);
    console.log('📌 레벨테스트 데이터:', req.body);

    const { level, score, totalQuestions, correctAnswers, answers } = req.body;
    const userId = req.user.user_id;

    // User 테이블의 current_level 직접 업데이트
    await db.User.update(
      { 
        current_level: level,
        updated_at: new Date()
      },
      { where: { user_id: userId } }
    );
    console.log(`✅ 사용자 ${userId}의 레벨을 ${level}로 업데이트`);

    return res.status(201).json({ 
      success: true, 
      message: '레벨테스트 결과가 성공적으로 저장되었습니다.',
      data: {
        level,
        score,
        userId,
        totalQuestions,
        correctAnswers
      }
    });
  } catch (err) {
    console.error('❌ 레벨테스트 결과 저장 중 오류:', err);
    return res.status(500).json({ 
      success: false, 
      message: '서버 오류가 발생했습니다.', 
      error: err.message 
    });
  }
});

// 레벨테스트 결과 조회 (사용자 현재 레벨 반환)
router.get('/result', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user.user_id;

    // users 테이블에서 current_level 조회
    const user = await db.User.findOne({
      where: { user_id: userId },
      attributes: ['user_id', 'current_level', 'updated_at']
    });

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: '사용자를 찾을 수 없습니다.' 
      });
    }

    return res.status(200).json({ 
      success: true, 
      data: {
        userId: user.user_id,
        currentLevel: user.current_level,
        lastUpdated: user.updated_at
      }
    });
  } catch (err) {
    console.error('❌ 레벨테스트 결과 조회 중 오류:', err);
    return res.status(500).json({ 
      success: false, 
      message: '서버 오류가 발생했습니다.', 
      error: err.message 
    });
  }
});

module.exports = router;
