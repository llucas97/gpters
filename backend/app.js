require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const cors = require('cors');
const express = require('express');
const session = require('express-session');
const passport = require('passport');
require('dotenv').config();
const path = require('path');
const initPassport = require('./auth/passport');
const localAuthRoutes = require('./routes/localAuth');
const db = require('./models');
const surveyRouter = require('./routes/survey');
const profileRoutes = require('./routes/profile');
const problemRoutes = require('./routes/problem');
// 새로운 테스트 시스템 라우터들
const resultRoutes = require('./routes/resultRoutes');
const levelRoutes = require('./routes/levelRoutes');
const levelTestRoutes = require('./routes/levelTest');
const analysisRoutes = require('./routes/analysisRoutes');

const problemBankRoutes = require('./routes/problemBank');
const analyticsRoutes = require('./routes/analytics');
const solveRoutes = require('./routes/solve');
const bojRoutes = require('./routes/boj');
const blockCodingRoutes = require('./routes/blockCoding');

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

// ✅ 테스트 라우트 (데이터베이스 연결 확인)
app.get('/api/test', async (req, res) => {
  try {
    await db.sequelize.authenticate();
    res.json({ success: true, message: 'Database connection successful' });
  } catch (error) {
    console.error('Database connection failed:', error);
    res.status(500).json({ success: false, message: 'Database connection failed', error: error.message });
  }
});

// ✅ API 라우터들
app.use('/api/auth', localAuthRoutes);     // 로그인/회원가입
app.use('/api/profile', profileRoutes);
app.use('/api/survey', surveyRouter);
app.use('/api/problems', problemRoutes);
app.use('/survey', surveyRouter);

// 새로운 테스트 시스템 API 라우터들
app.use('/api/results', resultRoutes);
app.use('/api/level', levelRoutes);
app.use('/api/level-test', levelTestRoutes);
app.use('/api/analysis', analysisRoutes);

app.use('/api/problem-bank', problemBankRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/solve', solveRoutes);
app.use('/api/boj', bojRoutes);
app.use('/api/block-coding', blockCodingRoutes);

// API 전용 백엔드 - HTML 라우트 제거됨

app.get('/logout', (req, res, next) => {
  req.logout(err => {
    if (err) return next(err);
    res.redirect('/login');
  });
});





// ✅ 서버 시작 (테스트 환경이 아닌 경우에만)
if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

  // ✅ DB 연결
  db.sequelize.authenticate()
    .then(() => console.log("RDS 연결 성공"))
    .catch(err => console.error("RDS 연결 실패:", err));
}

// 테스트를 위해 app export
module.exports = app;
