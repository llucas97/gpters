const express = require('express');
const passport = require('passport');
const { generateToken } = require('./jwt');
const { User } = require('../models');  //  User 모델 import

const router = express.Router();

//  공통 콜백 핸들러
const handleSocialLogin = async (req, res) => {
  try {
    const user = await User.findOne({
      where: {
        provider: req.user.provider,
        provider_id: req.user.provider_id
      }
    });

    if (!user) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }

    const token = generateToken(user);
    const surveyRequired = !user.survey_completed;

    res.json({
      token,
      survey_required: surveyRequired,
      user_id: user.user_id,
    });
  } catch (err) {
    console.error('소셜 로그인 처리 중 오류:', err);
    res.status(500).json({ message: '서버 오류', error: err.message });
  }
};

// 구글 로그인
router.get('/google', passport.authenticate('google', { scope: ['email', 'profile'] }));
router.get('/google/callback',
  passport.authenticate('google', { session: false }),
  handleSocialLogin
);

//  카카오 로그인
router.get('/kakao', passport.authenticate('kakao'));
router.get('/kakao/callback',
  passport.authenticate('kakao', { session: false }),
  handleSocialLogin
);

//  깃허브 로그인
router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));
router.get('/github/callback',
  passport.authenticate('github', { session: false }),
  handleSocialLogin
);

module.exports = router;

