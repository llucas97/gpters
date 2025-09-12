'use strict';

const express = require('express');
const router = express.Router();
const { getUserTier, searchProblemsByTier } = require('../services/solvedac');
const { makeCloze, computeBlankConfig } = require('../services/openaiCloze');

router.get('/next', async (req, res) => {
  try {
    const handle = String(req.query.handle || '');
    if (!handle) return res.status(400).json({ error: 'handle required' });
    const language = String(req.query.lang || 'python').toLowerCase();
    const tags = String(req.query.tags || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const tier = (await getUserTier(handle).catch(() => null)) ?? 8;
    const tierMin = Math.max(1, tier - 2);
    const tierMax = Math.min(30, tier + 2);

    const probs = await searchProblemsByTier({ tierMin, tierMax, tags, page: 1 });
    if (!probs?.length) return res.status(404).json({ error: 'no problems for tier range', tierMin, tierMax });

    const problem = probs[Math.floor(Math.random() * probs.length)];

    const { blanks, depth } = computeBlankConfig({ tier, prevAcc: 0.6 });

    const cloze = await makeCloze({ problem, language, tags, tier, prevAcc: 0.6 });

    return res.json({
      user: { handle, tier, range: `${tierMin}..${tierMax}` },
      problem: { id: problem.problemId, title: problem.titleKo, level: problem.level },
      blankConfig: { requested: { blanks, depth }, actual: { blanks: cloze.blanksCount, depth: cloze.depth } },
      code: cloze.code,
      blanks: cloze.blanks.map(({ id, hint }) => ({ id, hint })), 
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'internal_error', detail: String(e.message || e) });
  }
});

module.exports = router;
