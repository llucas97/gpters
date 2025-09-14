require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const cors = require('cors');
const express = require('express');
const session = require('express-session');
const passport = require('passport');
require('dotenv').config();
const path = require('path');
// const authRoutes = require('./auth/routes');
const initPassport = require('./auth/passport');
const localAuthRoutes = require('./routes/localAuth');  // 로컬 회원가입 라우터
const db = require('./models');
const surveyRouter = require('./routes/survey');
const profileRoutes = require('./routes/profile');
const problemRoutes = require('./routes/problem');

// 새로운 테스트 시스템 라우터들
const resultRoutes = require('./routes/resultRoutes');
const levelRoutes = require('./routes/levelRoutes');
const analysisRoutes = require('./routes/analysisRoutes');
const levelTestRoutes = require('./routes/levelTest');

const quizRoutes = require('./routes/quiz');

const app = express();
initPassport();

app.use(cors({
  origin: 'http://localhost:5173',  // ✅ Vite dev server 주소
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(session({
  secret: 'my-dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false, // localhost에서는 false
  }
}));

// ✅ 미들웨어
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/api/profile', profileRoutes);
app.use('/api/survey', surveyRouter);
app.use('/api/problems', problemRoutes);
app.use('/survey', surveyRouter);

// 새로운 테스트 시스템 API 라우터들
app.use('/api/results', resultRoutes);
app.use('/api/level', levelRoutes);
app.use('/api/analysis', analysisRoutes);

app.use('/api/quiz', quizRoutes);

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public/index.html')));

app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'public/login.html')));

app.get('/signup', (req, res) => res.sendFile(path.join(__dirname, 'public/signup.html')));

app.get('/survey', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/survey.html'));
});

app.get('/home', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/home.html'));
});

app.get('/profile', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/profile.html'));
});

app.get('/level-test', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/level-test.html'));
});

app.get('/logout', (req, res, next) => {
  req.logout(err => {
    if (err) return next(err);
    res.redirect('/login');  
  });
});



// ✅ API 라우터
app.use('/api/auth', localAuthRoutes);     // /api/auth 경로로 변경    // 로컬 회원가입/로그인

// ✅ 서버 시작
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


// ✅ DB 연결
db.sequelize.authenticate()
  .then(() => console.log("RDS 연결 성공"))
  .catch(err => console.error("RDS 연결 실패:", err));
