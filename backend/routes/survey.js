const express = require('express');
const router = express.Router();
const db = require('../models');

// 로그인 여부 확인 미들웨어
const isAuthenticated = (req, res, next) => {
  console.log('🔍 인증 확인 중...');
  console.log('📌 req.isAuthenticated():', req.isAuthenticated());
  console.log('📌 req.user:', req.user);
  console.log('📌 req.session:', req.session);
  
  if (req.isAuthenticated()) return next();
  return res.status(401).json({ success: false, message: '로그인이 필요합니다.' });
};

router.post('/submit', isAuthenticated, async (req, res) => {
  try {
    console.log('📨 설문 요청 들어옴');
    console.log('📌 로그인된 사용자:', req.user.user_id);
    console.log('📌 설문 데이터:', req.body);
    console.log('📌 current_skill_level 타입:', typeof req.body.current_skill_level, req.body.current_skill_level);

    const {
      job_title,
      learning_purpose,
      current_skill_level,
      motivation,
      preferred_language
    } = req.body;

    const userId = req.user.user_id;

    // 이미 설문을 완료했는지 확인
    const existingSurvey = await db.Survey.findOne({ 
      where: { user_id: userId },
      attributes: ['survey_id', 'user_id', 'job_title', 'learning_purpose', 'current_skill_level', 'motivation', 'preferred_language', 'createdAt', 'updatedAt']
    });
    if (existingSurvey) {
      return res.status(409).json({ 
        success: false, 
        message: '이미 설문조사를 완료하셨습니다.' 
      });
    }

    // surveys 테이블에 저장
    const survey = await db.Survey.create({
      user_id: userId,
      job_title,
      learning_purpose,
      current_skill_level,
      motivation,
      preferred_language
    });

    // users 테이블에 survey_completed 플래그 true로 설정
    await db.User.update(
      { survey_completed: true },
      { where: { user_id: userId } }
    );

    return res.status(201).json({ 
      success: true, 
      message: '설문조사가 성공적으로 저장되었습니다.',
    });
  } catch (err) {
    console.error('❌ 설문 저장 중 오류:', err);
    return res.status(500).json({ 
      success: false, 
      message: '서버 오류가 발생했습니다.', 
    });
  }
});

// 사용자의 설문조사 결과 조회
router.get('/result', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user.user_id;

    const survey = await db.Survey.findOne({ 
      where: { user_id: userId },
      attributes: ['survey_id', 'user_id', 'job_title', 'learning_purpose', 'current_skill_level', 'motivation', 'preferred_language', 'createdAt', 'updatedAt']
    });

    if (!survey) {
      return res.status(404).json({ 
        success: false, 
        message: '설문조사 결과를 찾을 수 없습니다.' 
      });
    }

    return res.status(200).json({ 
      success: true, 
      data: survey 
    });
  } catch (err) {
    console.error('❌ 설문 조회 중 오류:', err);
    return res.status(500).json({ 
      success: false, 
      message: '서버 오류가 발생했습니다.', 
      error: err.message 
    });
  }
});

// 설문조사 완료 상태 확인
router.get('/status', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user.user_id;

    const user = await db.User.findByPk(userId, {
      attributes: ['survey_completed']
    });

    const survey = await db.Survey.findOne({ 
      where: { user_id: userId },
      attributes: ['survey_id']
    });

    return res.status(200).json({ 
      success: true, 
      data: {
        completed: user.survey_completed,
        hasSurvey: !!survey
      }
    });
  } catch (err) {
    console.error('❌ 설문 상태 조회 중 오류:', err);
    return res.status(500).json({ 
      success: false, 
      message: '서버 오류가 발생했습니다.', 
      error: err.message 
    });
  }
});

module.exports = router;

