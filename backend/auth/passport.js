const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const KakaoStrategy = require('passport-kakao').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const { User } = require('../models'); // Sequelize 모델
const { Op } = require('sequelize');

module.exports = () => {
  passport.serializeUser((user, done) => done(null, user));
  passport.deserializeUser((obj, done) => done(null, obj));

  // ✅ 공통 처리 함수: DB 저장 또는 조회
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
          survey_completed: false, // 최초 가입 시 설문 미완료
        }
      });

      done(null, {
        user_id: user.user_id,
        provider: user.provider,
        provider_id: user.provider_id,
        email: user.email
      });

    } catch (err) {
      done(err);
    }
  };

  // 🌐 Google 로그인 전략
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

  // 💬 Kakao 로그인 전략
  passport.use(new KakaoStrategy({
    clientID: process.env.KAKAO_CLIENT_ID,
    callbackURL: `${process.env.CALLBACK_BASE_URL}/kakao/callback`,
  }, async (accessToken, refreshToken, profile, done) => {
    const email = profile._json?.kakao_account?.email;
    const name = profile.username || profile.displayName || 'KakaoUser';
    const photo = profile._json?.properties?.profile_image;
    await findOrCreateSocialUser('kakao', profile, email, name, photo, done);
  }));

  // 💻 GitHub 로그인 전략
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
