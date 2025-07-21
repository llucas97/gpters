const express = require('express');
const router = express.Router();
const { User, Survey } = require('../models');
const { verifyTokenMiddleware } = require('../auth/middleware');

router.post('/submit', verifyTokenMiddleware, async (req, res) => {
  try {
    console.log('📨 설문 요청 들어옴');
    console.log('📌 req.user:', req.user);
    console.log('📌 req.body:', req.body);

    const {
      job_title,
      learning_purpose,
      current_skill_level,
      motivation,
      time_availability,
      preferred_language
    } = req.body;

    const email = req.user.email;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }

    // 🔥 surveys 테이블에 insert
    await Survey.create({
      user_id: user.user_id,
      job_title,
      learning_purpose,
      current_skill_level,
      motivation,
      time_availability,
      preferred_language
    });

    // ✅ users 테이블에 survey_completed 플래그 true로 설정
    user.survey_completed = true;
    await user.save();

    return res.status(200).json({ message: '설문 저장 성공', user_id: user.user_id });
  } catch (err) {
    console.error('❌ 설문 저장 중 오류:', err);
    return res.status(500).json({ message: '서버 오류', error: err.message });
  }
});

module.exports = router;

