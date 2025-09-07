// backend/routes/levelRoutes.js
const express = require('express');
const LevelController = require('../controllers/levelController');

const router = express.Router();

/**
 * 레벨 관련 라우트
 */

// 레벨 배정
router.post('/assign', LevelController.assignLevel);

// 레벨 변경 이력 조회
router.get('/history/:userId', LevelController.getLevelHistory);

// 현재 레벨 정보 조회
router.get('/current/:userId', LevelController.getCurrentLevel);

// 레벨 통계 조회
router.get('/stats/:userId', LevelController.getLevelStats);

// 레벨 추천 조회
router.get('/recommendations/:userId', LevelController.getLevelRecommendations);

module.exports = router;