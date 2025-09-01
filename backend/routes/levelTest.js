// backend/routes/levelTest.js
const express = require('express');
const router = express.Router();
const { User, LevelTest } = require('../models');
const { verifyTokenMiddleware } = require('../auth/middleware');

// answers 정규화: [true,false,...] / [1,0,...] / [{level,correct,confidence}, ...] / {stages:[...]}
function normalizeAnswers(raw) {
  if (!raw) return [];
  const arr = Array.isArray(raw) ? raw : (Array.isArray(raw?.stages) ? raw.stages : []);

  if (Array.isArray(arr) && (typeof arr[0] === 'boolean' || typeof arr[0] === 'number')) {
    return arr.map((v, idx) => ({ level: idx, correct: !!v, confidence: 1.0 }));
  }

  if (Array.isArray(arr) && typeof arr[0] === 'object') {
    return arr.map((o, idx) => ({
      level: typeof o.level === 'number' ? o.level : idx,
      correct:
        typeof o.correct === 'boolean' ? o.correct
      : typeof o.isCorrect === 'boolean' ? o.isCorrect
      : typeof o.result === 'boolean' ? o.result
      : !!o.pass,
      confidence: typeof o.confidence === 'number' ? o.confidence : 1.0,
    }));
  }

  return [];
}

// 시력검사식: 0→1→…→5 순서로 '처음 실패 전까지' 연속 통과한 마지막 레벨 배정
function analyzeLevelTest(normalized, options = {}) {
  const MAX_LEVEL = 5;
  const threshold = typeof options.confidenceThreshold === 'number' ? options.confidenceThreshold : 0.7;

  const byLevel = new Map();
  for (const it of normalized) {
    const lv = Math.max(0, Math.min(MAX_LEVEL, parseInt(it.level, 10) || 0));
    const list = byLevel.get(lv) || [];
    list.push(it);
    byLevel.set(lv, list);
  }

  const score = normalized.reduce((acc, cur) => {
    const ok = !!cur.correct && (typeof cur.confidence === 'number' ? cur.confidence >= threshold : true);
    return acc + (ok ? 1 : 0);
  }, 0);

  let assignedLevel = 0;
  for (let lv = 0; lv <= MAX_LEVEL; lv++) {
    const items = byLevel.get(lv) || [];
    if (items.length === 0) break;
    const pass = items.some(
      it => !!it.correct && (typeof it.confidence === 'number' ? it.confidence >= threshold : true)
    );
    if (pass) assignedLevel = lv;
    else break;
  }

  return { score, assignedLevel };
}

// 제출
router.post('/submit', verifyTokenMiddleware, async (req, res) => {
  try {
    const { answers, options } = req.body || {};
    if (!answers) return res.status(400).json({ message: 'answers 필드는 필수입니다.' });

    const email = req.user?.email;
    if (!email) return res.status(401).json({ message: '유효하지 않은 토큰입니다.' });

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });

    const normalized = normalizeAnswers(answers);
    const { score, assignedLevel } = analyzeLevelTest(normalized, options);

    const saved = await LevelTest.create({
      user_id: user.user_id,
      answers,
      score,
      assigned_level: assignedLevel,
    });

    // users.current_level 업데이트
    await user.update({ current_level: assignedLevel });

    return res.status(200).json({
      message: '레벨테스트 저장 및 레벨 배정 완료',
      data: {
        level_test_id: saved.level_test_id,
        user_id: user.user_id,
        score,
        assigned_level: assignedLevel,
        created_at: saved.created_at,
      },
    });
  } catch (err) {
    console.error('❌ level-test submit error:', err);
    return res.status(500).json({ message: '서버 오류', error: err.message });
  }
});

// 최근 기록 조회
router.get('/latest', verifyTokenMiddleware, async (req, res) => {
  try {
    const email = req.user?.email;
    if (!email) return res.status(401).json({ message: '유효하지 않은 토큰입니다.' });

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });

    const latest = await LevelTest.findOne({
      where: { user_id: user.user_id },
      order: [['created_at', 'DESC']],
    });

    if (!latest) return res.status(404).json({ message: '최근 레벨테스트 기록이 없습니다.' });

    return res.status(200).json({
      message: 'OK',
      data: {
        level_test_id: latest.level_test_id,
        score: latest.score,
        assigned_level: latest.assigned_level,
        answers: latest.answers,
        created_at: latest.created_at,
      },
    });
  } catch (err) {
    console.error('❌ level-test latest error:', err);
    return res.status(500).json({ message: '서버 오류', error: err.message });
  }
});

module.exports = router;
