const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const KakaoStrategy = require('passport-kakao').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const db = require('../models');
const { User } = db;
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');

module.exports = () => {
  
  //테스트하려고 잠깐 수정
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL } = process.env;
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_CALLBACK_URL) {
    console.warn('[auth] Google OAuth disabled: missing GOOGLE_* env. Skipping passport-google-oauth20.');
    return;
  }

  passport.serializeUser((user, done) => {
    done(null, user.user_id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findByPk(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // ✅ 로컬 로그인 전략
  passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
  }, async (email, password, done) => {
    try {
      console.log('🔍 Passport 로그인 시도:', email);
      
      const user = await User.findOne({ where: { email } });
      if (!user) {
        console.log('❌ 사용자 없음:', email);
        return done(null, false, { message: '존재하지 않는 사용자입니다' });
      }

      console.log('✅ 사용자 찾음:', user.email);
      
      const isValid = await bcrypt.compare(password, user.password_hash);
      if (!isValid) {
        console.log('❌ 비밀번호 불일치');
        return done(null, false, { message: '비밀번호가 일치하지 않습니다' });
      }

      console.log('✅ 비밀번호 일치');
      return done(null, user);
    } catch (err) {
      console.error('❌ Passport 에러:', err);
      return done(err);
    }
  }));

  // ✅ 공통: 소셜 로그인 시 DB에 저장 또는 조회
  const findOrCreateSocialUser = async (provider, profile, email, displayName, photoUrl, done) => {
    try {
      const [user, created] = await User.findOrCreate({
        where: { provider, provider_id: profile.id },
        defaults: {
          email,
          username: displayName?.replace(/\s+/g, '') || `${provider}_${profile.id}`,
          full_name: displayName || '',
          profile_image_url: photoUrl || '',
          provider,
          provider_id: profile.id,
          is_active: true,
          email_verified: !!email,
          survey_completed: false
        }
      });

      done(null, user); // 세션 저장은 serializeUser가 처리함
    } catch (err) {
      done(err);
    }
  };

  // ✅ Google
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.CALLBACK_BASE_URL}/google/callback`,
  }, async (accessToken, refreshToken, profile, done) => {
    const email = profile.emails?.[0]?.value;
    const name = profile.displayName;
    const photo = profile.photos?.[0]?.value;
    await findOrCreateSocialUser('google', profile, email, name, photo, done);
  }));

  // ✅ Kakao
  passport.use(new KakaoStrategy({
    clientID: process.env.KAKAO_CLIENT_ID,
    callbackURL: `${process.env.CALLBACK_BASE_URL}/kakao/callback`,
  }, async (accessToken, refreshToken, profile, done) => {
    const email = profile._json?.kakao_account?.email;
    const name = profile.displayName || 'KakaoUser';
    const photo = profile._json?.properties?.profile_image;
    await findOrCreateSocialUser('kakao', profile, email, name, photo, done);
  }));

  // ✅ GitHub
  passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: `${process.env.CALLBACK_BASE_URL}/github/callback`,
  }, async (accessToken, refreshToken, profile, done) => {
    const email = profile.emails?.[0]?.value;
    const name = profile.username || profile.displayName || 'GitHubUser';
    const photo = profile.photos?.[0]?.value;
    await findOrCreateSocialUser('github', profile, email, name, photo, done);
  }));
};
