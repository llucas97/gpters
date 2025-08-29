const express = require('express');
const bcrypt = require('bcryptjs');
const { User } = require('../models');
const passport = require('passport');
const router = express.Router();

// ✅ 로그인 - 세션 기반
router.post('/login', passport.authenticate('local'), (req, res) => {
  // passport가 자동으로 req.login() 수행 → 세션에 저장됨
  res.json({ success: true, user_id: req.user.user_id });
});

router.post('/signup', async (req, res) => {
  // 디버깅: 받은 데이터 확인
  console.log('🔍 받은 req.body:', req.body);
  console.log('🔍 full_name 값:', req.body.full_name);
  console.log('🔍 각 필드 타입 확인:');
  console.log('  - email:', typeof req.body.email, req.body.email);
  console.log('  - username:', typeof req.body.username, req.body.username);
  console.log('  - full_name:', typeof req.body.full_name, req.body.full_name);
  console.log('  - password:', typeof req.body.password, req.body.password);

  const { email, password, username, full_name } = req.body;

  try {
    const exists = await User.findOne({ where: { email } });
    if (exists) return res.status(409).json({ message: '이미 등록된 이메일입니다.' });

    const hashed = await bcrypt.hash(password, 10);

    console.log('🔍 데이터베이스 저장 전 데이터:');
    console.log('  - email:', email);
    console.log('  - username:', username);
    console.log('  - full_name:', full_name);

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

    console.log('✅ 사용자 생성 완료:', user.toJSON());

    res.status(201).json({ message: '회원가입 성공', user_id: user.user_id });
  } catch (err) {
    console.error('❌ 회원가입 에러:', err);
    res.status(500).json({ message: '서버 오류', error: err.message });
  }
});

module.exports = router;
