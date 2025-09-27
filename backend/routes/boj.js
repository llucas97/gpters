// backend/routes/boj.js
'use strict';

const express = require('express');
const router = express.Router();
const {
  TOTAL_STEPS, BUCKETS, stepToUserLevel, userLevelToStepRange
} = require('../services/bojSteps');

// 헬스/설정 확인
router.get('/health', (_req, res) => {
  res.json({ total_steps: TOTAL_STEPS, buckets: BUCKETS });
});

// step -> user level
// GET /api/boj/step-level?step=34
router.get('/step-level', (req, res) => {
  const { step } = req.query;
  const level = stepToUserLevel(step);
  res.json({ step: Number(step), level });
});

// level -> step range
// GET /api/boj/step-range?level=3
router.get('/step-range', (req, res) => {
  const { level } = req.query;
  const range = userLevelToStepRange(level);
  res.json({ level: Number(level), range });
});

module.exports = router;
