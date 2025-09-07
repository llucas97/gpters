// backend/routes/resultRoutes.js
const express = require('express');
const ResultController = require('../controllers/resultController');

const router = express.Router();

/**
 * 결과 분석 관련 라우트
 */

// 사용자 분석 결과 조회
router.get('/analysis/:userId', ResultController.getUserAnalysis);

// 사용자 제출 이력 조회
router.get('/history/:userId', ResultController.getUserSubmissionHistory);

// 실시간 세션 분석
router.get('/session/:sessionId', ResultController.getSessionAnalysis);

// 성과 리포트 생성
router.get('/report/:sessionId', ResultController.generatePerformanceReport);

// 레벨 배정 수행
router.post('/assign-level', ResultController.assignLevel);

module.exports = router;