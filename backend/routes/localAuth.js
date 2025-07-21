const express = require('express');
const bcrypt = require('bcryptjs');
const { User } = require('../models');  // ✅ models/index.js에서 불러오는 방식 권장
const { generateToken } = require('../auth/jwt');
const router = express.Router();

// 회원가입
router.post('/register', async (req, res) => {
  const { email, password, username, full_name } = req.body;

  try {
    const exists = await User.findOne({ where: { email } });
    if (exists) return res.status(409).json({ message: '이미 등록된 이메일입니다.' });

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      username,
      full_name,
      password_hash: hashed,      // ✅ 정확한 필드명
      provider: 'local',
      survey_completed: false,
      is_active: true,
      email_verified: false,
    });

    res.status(201).json({ message: '회원가입 성공', user_id: user.user_id });
  } catch (err) {
    res.status(500).json({ message: '서버 오류', error: err.message });
  }
});

// 로그인
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) return res.status(401).json({ message: '비밀번호가 일치하지 않습니다.' });

    const token = generateToken({ email: user.email, user_id: user.user_id });
    const surveyRequired = !user.survey_completed;

    return res.json({
      token,
      survey_required: surveyRequired,
      user_id: user.user_id
    });
  } catch (err) {
    console.error('로그인 중 에러:', err);
    return res.status(500).json({ message: '서버 내부 오류', error: err.message });
  }
});

module.exports = router;
