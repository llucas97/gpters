const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// 보안 미들웨어
app.use(helmet());

// CORS 설정
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 100, // 최대 100 요청
  message: '너무 많은 요청이 있습니다. 잠시 후 다시 시도해주세요.'
});
app.use(limiter);

// 로깅
app.use(morgan('combined'));

// JSON 파싱
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 라우트 임포트
const surveyRoutes = require('./routes/survey');
const profileRoutes = require('./routes/profile');

// API 라우트
app.use('/api/survey', surveyRoutes);
app.use('/api/profile', profileRoutes);

// 헬스 체크 엔드포인트
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Gpters API 서버가 정상 작동 중입니다.',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// 루트 엔드포인트
app.get('/', (req, res) => {
  res.json({
    message: 'Gpters API에 오신 것을 환영합니다!',
    documentation: '/api/docs',
    health: '/health'
  });
});

// 404 에러 핸들러
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: '요청하신 엔드포인트를 찾을 수 없습니다.'
  });
});

// 전역 에러 핸들러
app.use((error, req, res, next) => {
  console.error('Error:', error);
  
  res.status(error.status || 500).json({
    error: error.name || 'Internal Server Error',
    message: error.message || '서버 내부 오류가 발생했습니다.',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`🚀 Gpters API 서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log(`📱 프론트엔드 URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  console.log(`🔍 헬스 체크: http://localhost:${PORT}/health`);
});

module.exports = app; 