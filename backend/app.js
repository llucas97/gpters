require('dotenv').config();
const express = require('express');
const passport = require('passport');
const path = require('path');
const authRoutes = require('./auth/routes');
const initPassport = require('./auth/passport');
const localAuthRoutes = require('./routes/localAuth');  // 로컬 회원가입 라우터
const db = require('./models');
const surveyRouter = require('./routes/survey');



const app = express();
initPassport();

// ✅ 미들웨어
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/survey', surveyRouter);
app.use('/local', localAuthRoutes);
// ✅ 페이지 라우팅
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public/index.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'public/login.html')));
app.get('/register', (req, res) => res.sendFile(path.join(__dirname, 'public/register.html')));
app.get('/survey', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/survey.html'));
});

app.get('/home', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/home.html'));
});


// ✅ API 라우터
app.use('/auth', authRoutes);          // 소셜 로그인
app.use('/auth', localAuthRoutes);     // 로컬 회원가입/로그인

// ✅ 서버 시작
app.listen(3000, () => console.log('Server running on http://localhost:3000'));

// ✅ DB 연결
db.sequelize.authenticate()
  .then(() => console.log("RDS 연결 성공"))
  .catch(err => console.error("RDS 연결 실패:", err));
