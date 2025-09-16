'use strict';

const express = require('express');
const router = express.Router();
const { getUserTier, searchProblemsByTier, getProblemDetail } = require('../services/solvedac');
const { makeCloze, computeBlankConfig } = require('../services/openaiCloze');

router.get('/next', async (req, res) => {
  try {
    const handle = String(req.query.handle || '');
    const language = String(req.query.lang || 'python').toLowerCase();
    const tags = String(req.query.tags || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    let tier, tierMin, tierMax;
    if (handle) {
      tier = (await getUserTier(handle).catch(() => null)) ?? 8;
      tierMin = Math.max(1, tier - 2);
      tierMax = Math.min(30, tier + 2);
    } else {
      tier = Math.floor(Math.random() * 15) + 1;
      tierMin = Math.max(1, tier - 2);
      tierMax = Math.min(30, tier + 2);
    }

    const probs = await searchProblemsByTier({ tierMin, tierMax, tags, page: 1 });
    if (!probs?.length) return res.status(404).json({ error: 'no problems for tier range', tierMin, tierMax });

    const problem = probs[Math.floor(Math.random() * probs.length)];

    console.log(`Getting problem detail for: ${problem.problemId}`);
    const problemDetail = await getProblemDetail(problem.problemId);
    console.log(`Problem detail result:`, problemDetail ? 'Success' : 'Failed');

    const { blanks, depth } = computeBlankConfig({ tier, prevAcc: 0.6 });

    const cloze = await makeCloze({ problem, language, tags, tier, prevAcc: 0.6 });

    return res.json({
      user: { handle: handle || '랜덤', tier, range: `${tierMin}..${tierMax}` },
      problem: { 
        id: problem.problemId, 
        title: problem.titleKo, 
        level: problem.level,
        url: problem.url,
        description: problemDetail?.description || `백준 ${problem.problemId}번 문제입니다.`,
        inputDescription: problemDetail?.inputDescription || '',
        outputDescription: problemDetail?.outputDescription || '',
        examples: problemDetail?.examples || [],
        tags: problemDetail?.tags || problem.tags || []
      },
      blankConfig: { requested: { blanks, depth }, actual: { blanks: cloze.blanksCount, depth: cloze.depth } },
      code: cloze.code,
      blanks: cloze.blanks.map(({ id, hint, answer }) => ({ id, hint, answer })), 
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'internal_error', detail: String(e.message || e) });
  }
});

module.exports = router;
