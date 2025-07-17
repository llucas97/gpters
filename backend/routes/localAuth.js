const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/user.model');
const { generateToken } = require('../auth/jwt');  // 기존 JWT 로직 재활용
const router = express.Router();

// 회원가입
router.post('/register', async (req, res) => {
  const { email, password } = req.body;
  try {
    const exists = await User.findOne({ where: { email } });
    if (exists) return res.status(409).json({ message: '이미 등록된 이메일입니다.' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password: hashed });
    res.status(201).json({ message: '회원가입 성공', userId: user.id });
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

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(401).json({ message: '비밀번호가 일치하지 않습니다.' });

    const token = generateToken({ id: user.id, email: user.email });
    res.json({ message: '로그인 성공', token });
  } catch (err) {
    res.status(500).json({ message: '서버 오류', error: err.message });
  }
});

module.exports = router;
