const express = require('express');
const bcrypt = require('bcryptjs');
const { User } = require('../models');
const passport = require('passport');
const router = express.Router();

// ✅ 회원가입
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
      password_hash: hashed,
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

// ✅ 로그인 - 세션 기반
router.post('/login', passport.authenticate('local'), (req, res) => {
  // passport가 자동으로 req.login() 수행 → 세션에 저장됨
  res.json({ success: true, user_id: req.user.user_id });
});

module.exports = router;

