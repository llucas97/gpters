const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const KakaoStrategy = require('passport-kakao').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const { generateToken } = require('./jwt');

module.exports = () => {
  passport.serializeUser((user, done) => done(null, user));
  passport.deserializeUser((obj, done) => done(null, obj));

  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.CALLBACK_BASE_URL}/google/callback`,
  }, (accessToken, refreshToken, profile, done) => {
    const user = { id: profile.id, email: profile.emails[0].value };
    done(null, user);
  }));

  passport.use(new KakaoStrategy({
    clientID: process.env.KAKAO_CLIENT_ID,
    callbackURL: `${process.env.CALLBACK_BASE_URL}/kakao/callback`,
  }, (accessToken, refreshToken, profile, done) => {
    const user = { id: profile.id, email: profile._json.kakao_account.email };
    done(null, user);
  }));

  passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: `${process.env.CALLBACK_BASE_URL}/github/callback`,
  }, (accessToken, refreshToken, profile, done) => {
    const user = { id: profile.id, email: profile.emails[0].value };
    done(null, user);
  }));
};
