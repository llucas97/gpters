const bcrypt = require('bcrypt'); 
const express = require('express');
const router = express.Router();
const db = require('../models');

// 로그인 여부 확인
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  return res.status(401).json({ success: false, message: '로그인이 필요합니다.' });
};

// ✅ GET /api/profile : 로그인된 유저의 전체 프로필 정보 반환
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const user = await db.User.findByPk(req.user.user_id, {
      attributes: [
        'user_id', 'email', 'username', 'full_name', 
        'profile_image_url', 'current_level', 'experience_points',
        'survey_completed', 'created_at'
      ]
    });

    if (!user) return res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다.' });

    // 프론트엔드 형식에 맞게 데이터 변환
    const profileData = {
      id: user.user_id.toString(),
      username: user.username,
      email: user.email,
      name: user.full_name || user.username,
      profileImage: user.profile_image_url,
      bio: '', // 추후 추가 가능
      location: '', // 추후 추가 가능
      website: '', // 추후 추가 가능
      joinDate: user.created_at,
      currentLevel: user.current_level,
      experiencePoints: user.experience_points,
      surveyCompleted: user.survey_completed
    };

    res.json({ success: true, data: profileData });
  } catch (err) {
    console.error('프로필 조회 에러:', err);
    res.status(500).json({ success: false, message: '서버 오류', error: err.message });
  }
});

// ✅ PUT /api/profile : 프로필 정보 수정
router.put('/', isAuthenticated, async (req, res) => {
  const { name, username, email, bio, location, website, profileImage } = req.body;

  try {
    const user = await db.User.findByPk(req.user.user_id);
    if (!user) return res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다.' });

    // 업데이트할 필드들
    if (name !== undefined) user.full_name = name;
    if (username !== undefined) user.username = username;
    if (email !== undefined) user.email = email;
    if (profileImage !== undefined) user.profile_image_url = profileImage;
    
    await user.save();

    // 업데이트된 프로필 데이터 반환
    const updatedProfileData = {
      id: user.user_id.toString(),
      username: user.username,
      email: user.email,
      name: user.full_name || user.username,
      profileImage: user.profile_image_url,
      bio: bio || '',
      location: location || '',
      website: website || '',
      joinDate: user.created_at,
      currentLevel: user.current_level,
      experiencePoints: user.experience_points,
      surveyCompleted: user.survey_completed
    };

    res.json({ success: true, data: updatedProfileData, message: '프로필이 성공적으로 수정되었습니다.' });
  } catch (err) {
    console.error('프로필 수정 에러:', err);
    res.status(500).json({ success: false, message: '수정 중 오류 발생', error: err.message });
  }
});


router.put('/password', isAuthenticated, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: '모든 필드를 입력해주세요.' });
  }

  try {
    const user = await db.User.findByPk(req.user.user_id);

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
