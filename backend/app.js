const cors = require('cors');
const express = require('express');
const session = require('express-session');
const passport = require('passport');
require('dotenv').config();
const path = require('path');
const authRoutes = require('./auth/routes');
const initPassport = require('./auth/passport');
const localAuthRoutes = require('./routes/localAuth');  // 로컬 회원가입 라우터
const db = require('./models');
const surveyRouter = require('./routes/survey');
const profileRoutes = require('./routes/profile');



const app = express();
initPassport();

app.use(cors({
  origin: 'http://localhost:3000',  // 프론트엔드 주소
  credentials: true,                 // 세션 사용 시 true (passport 등)
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
app.use('/survey', surveyRouter);
app.use('/', localAuthRoutes);



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

app.get('/logout', (req, res, next) => {
  req.logout(err => {
    if (err) return next(err);
    res.redirect('/login');  
  });
});



// ✅ API 라우터
app.use('/auth', authRoutes);          // 소셜 로그인
app.use('/auth', localAuthRoutes);     // 로컬 회원가입/로그인

// ✅ 서버 시작
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


// ✅ DB 연결
db.sequelize.authenticate()
  .then(() => console.log("RDS 연결 성공"))
  .catch(err => console.error("RDS 연결 실패:", err));
