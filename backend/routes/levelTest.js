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

// 레벨 테스트 시작 가능 여부 확인
router.get('/check', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user.user_id;
    
    const user = await db.User.findOne({
      where: { user_id: userId },
      attributes: ['user_id', 'current_level']
    });

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: '사용자를 찾을 수 없습니다.' 
      });
    }

    // current_level이 -1이 아니면 이미 테스트 완료 (-1: 미완료, 0~5: 완료)
    const isCompleted = user.current_level >= 0;
    
    return res.status(200).json({ 
      success: true, 
      canTakeTest: !isCompleted,
      isCompleted: isCompleted,
      currentLevel: user.current_level,
      message: isCompleted ? '이미 레벨 테스트를 완료하셨습니다.' : '레벨 테스트를 시작할 수 있습니다.'
    });
  } catch (err) {
    console.error('❌ 레벨테스트 체크 중 오류:', err);
    return res.status(500).json({ 
      success: false, 
      message: '서버 오류가 발생했습니다.', 
      error: err.message 
    });
  }
});

// 기존 사용자 current_level 업데이트 (0 -> -1)
router.post('/migrate-levels', async (req, res) => {
  try {
    const [updatedCount] = await db.User.update(
      { current_level: -1 },
      { where: { current_level: 0 } }
    );
    
    console.log(`✅ ${updatedCount}명의 사용자 레벨을 0에서 -1로 업데이트`);
    
    return res.status(200).json({ 
      success: true, 
      message: '기존 사용자 레벨 업데이트 완료',
      updatedCount: updatedCount
    });
  } catch (err) {
    console.error('❌ 레벨 마이그레이션 오류:', err);
    return res.status(500).json({ 
      success: false, 
      message: '마이그레이션 중 오류가 발생했습니다.', 
      error: err.message 
    });
  }
});

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

    // 먼저 사용자가 이미 레벨 테스트를 완료했는지 확인
    const user = await db.User.findOne({
      where: { user_id: userId },
      attributes: ['user_id', 'current_level']
    });

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: '사용자를 찾을 수 없습니다.' 
      });
    }

    // 이미 레벨 테스트를 완료한 경우 거부 (-1이 아니면 완료)
    if (user.current_level >= 0) {
      console.log(`❌ 사용자 ${userId}는 이미 레벨 테스트를 완료했습니다. (현재 레벨: ${user.current_level})`);
      return res.status(409).json({ 
        success: false, 
        message: '이미 레벨 테스트를 완료하셨습니다. 레벨 테스트는 한 번만 응시할 수 있습니다.',
        currentLevel: user.current_level
      });
    }

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
