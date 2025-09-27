const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../models');
const passport = require('passport');
const router = express.Router();

// ✅ 로그인 - 세션 기반
router.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      console.error('❌ Passport 인증 에러:', err);
      return res.status(500).json({ message: '서버 오류', error: err.message });
    }
    
    if (!user) {
      return res.status(401).json({ message: info.message || '로그인 실패' });
    }

    // rememberMe 옵션에 따라 세션 만료 시간 설정
    const rememberMe = req.body.rememberMe === true;
    const maxAge = rememberMe ? 2 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000; // 2시간 또는 1일
    
    req.login(user, (err) => {
      if (err) {
        console.error('❌ req.login 에러:', err);
        return res.status(500).json({ message: '서버 오류', error: err.message });
      }

      // 세션 쿠키 만료 시간 설정
      req.session.cookie.maxAge = maxAge;
      
      // 사용자 정보 조회 및 응답
      db.User.findByPk(user.user_id, {
        attributes: ['user_id', 'email', 'username', 'full_name', 'survey_completed']
      }).then(userData => {
        console.log(`✅ 로그인 성공: ${userData.email} (rememberMe: ${rememberMe}, maxAge: ${maxAge}ms)`);
        
        res.json({ 
          success: true, 
          user: {
            id: userData.user_id,
            email: userData.email,
            username: userData.username,
            survey_completed: userData.survey_completed
          }
        });
      }).catch(err => {
        console.error('❌ 사용자 정보 조회 에러:', err);
        res.status(500).json({ message: '서버 오류', error: err.message });
      });
    });
  })(req, res, next);
});

// ✅ 현재 로그인된 사용자 정보 조회
router.get('/me', async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: '로그인이 필요합니다.' });
  }

  try {
    const user = await db.User.findByPk(req.user.user_id, {
      attributes: ['user_id', 'email', 'username', 'full_name', 'current_level', 'profile_image_url', 'survey_completed']
    });

    if (!user) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }

    res.json({
      user_id: user.user_id,
      email: user.email,
      username: user.username,
      full_name: user.full_name,
      current_level: user.current_level,
      profile_image_url: user.profile_image_url,
      survey_completed: user.survey_completed
    });
  } catch (err) {
    console.error('❌ 사용자 정보 조회 에러:', err);
    res.status(500).json({ message: '서버 오류', error: err.message });
  }
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
    const exists = await db.User.findOne({ where: { email } });
    if (exists) return res.status(409).json({ message: '이미 등록된 이메일입니다.' });

    const hashed = await bcrypt.hash(password, 10);

    console.log('🔍 데이터베이스 저장 전 데이터:');
    console.log('  - email:', email);
    console.log('  - username:', username);
    console.log('  - full_name:', full_name);

    const user = await db.User.create({
      email,
      username,
      full_name,
      password_hash: hashed,
      provider: 'local',
      survey_completed: false,
      is_active: true,
      email_verified: false,
    });


    console.log('사용자 생성 완료:', user.toJSON());

    res.status(201).json({ message: '회원가입 성공', user_id: user.user_id });
  } catch (err) {
    console.error('❌ 회원가입 에러:', err);
    res.status(500).json({ message: '서버 오류', error: err.message });
  }
});

module.exports = router;
