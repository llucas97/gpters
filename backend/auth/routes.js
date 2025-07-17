const express = require('express');
const passport = require('passport');
const { generateToken } = require('./jwt');
const router = express.Router();

//  구글 로그인
router.get('/google', passport.authenticate('google', { scope: ['email', 'profile'] }));
router.get('/google/callback',
  passport.authenticate('google', { session: false }),
  (req, res) => {
    const token = generateToken(req.user);
    res.json({ token });
  }
);

// 카카오 로그인
router.get('/kakao', passport.authenticate('kakao'));
router.get('/kakao/callback',
  passport.authenticate('kakao', { session: false }),
  (req, res) => {
    const token = generateToken(req.user);
    res.json({ token });
  }
);

//  깃허브 로그인
router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));
router.get('/github/callback',
  passport.authenticate('github', { session: false }),
  (req, res) => {
    const token = generateToken(req.user);
    res.json({ token });
  }
);

module.exports = router;
