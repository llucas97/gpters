// backend/services/bojSteps.js
'use strict';

const TOTAL_STEPS = 68;

// 균형 버킷 (12,12,11,11,11,11) → 합 68
const BUCKETS = [
  { level: 0, start: 1,  end: 12 },
  { level: 1, start: 13, end: 24 },
  { level: 2, start: 25, end: 35 },
  { level: 3, start: 36, end: 46 },
  { level: 4, start: 47, end: 57 },
  { level: 5, start: 58, end: 68 }
];

function clampStep(step) {
  const num = Number(step);
  const s = isNaN(num) ? 1 : Math.max(1, Math.min(TOTAL_STEPS, num));
  return s;
}

function stepToUserLevel(step) {
  const s = clampStep(step);
  const b = BUCKETS.find(b => s >= b.start && s <= b.end);
  return b ? b.level : 0;
}

function userLevelToStepRange(level) {
  const lv = Math.max(0, Math.min(5, Number(level || 0)));
  const b = BUCKETS.find(b => b.level === lv);
  return b ? { start: b.start, end: b.end } : { start: 1, end: 12 };
}

module.exports = {
  TOTAL_STEPS,
  BUCKETS,
  clampStep,
  stepToUserLevel,
  userLevelToStepRange
};
