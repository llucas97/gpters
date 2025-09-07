// backend/routes/analysisRoutes.js
const express = require('express');
const ResultController = require('../controllers/resultController');

const router = express.Router();

/**
 * 분석 관련 라우트
 */

// 실시간 세션 분석
router.get('/session/:sessionId', ResultController.getSessionAnalysis);

module.exports = router;