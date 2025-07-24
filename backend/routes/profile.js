const bcrypt = require('bcrypt'); 
const express = require('express');
const router = express.Router();
const { User } = require('../models');

// 로그인 여부 확인
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  return res.status(401).json({ success: false, message: '로그인이 필요합니다.' });
};

// ✅ GET /api/profile : 로그인된 유저의 이름(full_name)과 사용자명(username) 반환
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.user_id, {
      attributes: ['full_name', 'username']
    });

    if (!user) return res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다.' });

    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: '서버 오류', error: err.message });
  }
});

// ✅ PUT /api/profile : 이름(full_name)과 사용자명(username) 수정
router.put('/', isAuthenticated, async (req, res) => {
  const { full_name, username } = req.body;

  try {
    const user = await User.findByPk(req.user.user_id);
    if (!user) return res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다.' });

    user.full_name = full_name;
    user.username = username;
    await user.save();

    res.json({ success: true, message: '프로필이 성공적으로 수정되었습니다.' });
  } catch (err) {
    res.status(500).json({ success: false, message: '수정 중 오류 발생', error: err.message });
  }
});


router.put('/password', isAuthenticated, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: '모든 필드를 입력해주세요.' });
  }

  try {
    const user = await User.findByPk(req.user.user_id);

    if (!user) return res.status(404).json({ success: false, message: '사용자 없음' });

    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: '현재 비밀번호가 올바르지 않습니다.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password_hash = hashedPassword;
    await user.save();

    res.json({ success: true, message: '비밀번호가 성공적으로 변경되었습니다.' });
  } catch (err) {
    res.status(500).json({ success: false, message: '서버 오류', error: err.message });
  }
});

module.exports = router;
