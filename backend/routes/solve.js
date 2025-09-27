'use strict';

const express = require('express');
const router = express.Router();
const db = require('../models');
const vm = require('vm'); // js-only sandboxes for editor mode

// id 정상화: "__1__" → 1, "1" → 1
const normId = (x) => {
  const n = Number(String(x).replace(/\D/g, ''));
  return Number.isFinite(n) && n > 0 ? n : 0;
};

// 문제의 정답 맵 {1: 'answer', 2:'...'}
const buildAnswerMap = (blanks=[]) => {
  const map = {};
  blanks.forEach(b => {
    const k = normId(b.id);
    if (k) map[k] = (b.answer ?? '').trim();
  });
  return map;
};

/**
 * POST /api/solve/grade
 * body: {
 *   mode: 'block' | 'cloze' | 'editor',
 *   client_id?: string, handle?: string,
 *   problem_id: number,
 *   // block
 *   block_tokens?: string[],      // 유저가 배치한 토큰(=정답 토큰들)
 *   // cloze
 *   blanks_user?: Array<{ id: number|string, value: string }>,
 *   // editor
 *   language?: string, code?: string
 * }
 */
router.post('/grade', async (req, res) => {
  try {
    const mode = String(req.body?.mode || '').toLowerCase();
    const problemId = Number(req.body?.problem_id || 0);
    if (!mode || !problemId) {
      return res.status(400).json({ error: 'bad_request', detail: 'mode and problem_id required' });
    }
    const prob = await db.ProblemBank.findByPk(problemId);
    if (!prob) return res.status(404).json({ error: 'not_found', detail: 'problem not found' });

    const answers = buildAnswerMap(prob.blanks || []);
    const blanksTotal = Object.keys(answers).length;

    let blanksCorrect = 0;
    let feedback = {};
    let extra = {};

    if (mode === 'cloze') {
      const user = Array.isArray(req.body?.blanks_user) ? req.body.blanks_user : [];
      const resMap = {};
      user.forEach(item => {
        const k = normId(item.id);
        const u = String(item.value ?? '').trim();
        const a = (answers[k] ?? '').trim();
        const ok = a.length>0 && u.length>0 && a === u;
        if (ok) blanksCorrect++;
        resMap[k] = { user: u, answer: a, correct: ok };
      });
      feedback = resMap;
    }

    else if (mode === 'block') {
      // 가장 단순한 룰: 정답 토큰(answers)을 모두 포함하고 순서가 일치하면 정답.
      // (레벨 0-1용. 향후 블록 DSL이나 블록 ID 기반 검사로 고도화 가능)
      const tokens = Array.isArray(req.body?.block_tokens) ? req.body.block_tokens.map(s => String(s).trim()) : [];
      const keyOrder = Object.keys(answers).map(Number).sort((a,b)=>a-b);
      const expectedSeq = keyOrder.map(k => answers[k]);
      const minLen = Math.min(tokens.length, expectedSeq.length);
      for (let i=0;i<minLen;i++){
        const ok = tokens[i] === expectedSeq[i];
        if (ok) blanksCorrect++;
        feedback[i+1] = { user: tokens[i], answer: expectedSeq[i], correct: ok };
      }
      extra.expected = expectedSeq;
      extra.received = tokens;
    }

    else if (mode === 'editor') {
      const lang = String(req.body?.language || 'javascript').toLowerCase();
      const code = String(req.body?.code || '');
      if (lang !== 'javascript') {
        return res.status(400).json({ error: 'language_not_supported', detail: 'editor mode supports javascript only for now' });
      }

      // 문제 예시를 테스트로 사용: solve(input) -> output 비교
      const examples = Array.isArray(prob.examples) ? prob.examples : [];
      let passed = 0;
      const results = [];
      try {
        // 샌드박스 준비
        const sandbox = {};
        const context = vm.createContext(sandbox);
        
        // 유저 코드 + solve 함수 존재 확인
        vm.runInContext(`${code}\nif (typeof solve !== 'function') { throw new Error('solve function missing'); }`, context, { timeout: 1000 });

        for (const ex of examples) {
          // input 을 배열/단일로 파싱 시도 (간단한 규칙)
          const argText = String(ex.input ?? '').trim();
          let args;
          try {
            // "[1,2]" 또는 "1 2" 등 처리
            if (/^\s*\[/.test(argText)) {
              args = JSON.parse(argText);
              if (!Array.isArray(args)) args = [args];
            } else {
              args = argText.length ? argText.split(/\s+/).map(x => isNaN(Number(x)) ? x : Number(x)) : [];
            }
          } catch { args = [argText]; }

          const expected = String(ex.output ?? '').trim();
          let got;
          try {
            got = vm.runInContext(`solve.apply(null, ${JSON.stringify(args)})`, context, { timeout: 1000 });
          } catch (err) {
            results.push({ input: args, error: String(err?.message || err) });
            continue;
          }
          const ok = String(got) === expected;
          if (ok) passed++;
          results.push({ input: args, output: String(got), expected, correct: ok });
        }
      } catch (e) {
        return res.status(200).json({ ok: false, mode, problem_id: problemId, error: String(e.message || e) });
      }
      blanksCorrect = passed;
      // blanksTotal 을 테스트 케이스 수로 간주
      extra.tests = results;
      // cloze와 형식을 맞추기 위해 feedback에 요약만
      feedback = Object.fromEntries(results.map((r, i) => [i+1, { user: r.output, answer: r.expected, correct: !!r.correct }]));
    }

    else {
      return res.status(400).json({ error: 'bad_request', detail: 'unknown mode' });
    }

    const accuracy = blanksTotal > 0 ? (blanksCorrect / blanksTotal) * 100 : 0;

    // 학습 세션 로깅 (client_id/handle 둘 다 허용)
    try {
      const started = req.body?.started_at ? new Date(req.body.started_at) : new Date();
      const finished = req.body?.finished_at ? new Date(req.body.finished_at) : new Date();
      const duration = req.body?.duration_ms ?? (finished - started);
      await db.StudySession.create({
        handle: req.body?.handle || 'anonymous',
        client_id: req.body?.client_id || null,
        language: prob.language || 'python',
        topic: prob.topic || 'unknown',
        level: prob.level || 0,
        source: 'bank',
        problem_id: prob.id,
        started_at: started,
        finished_at: finished,
        duration_ms: duration,
        blanks_total: blanksTotal,
        blanks_correct: blanksCorrect,
        blanks_detail: feedback
      });
    } catch (e) {
      console.warn('[solve/grade] log save failed:', e?.message || e);
    }

    res.json({
      ok: true,
      mode,
      problem_id: problemId,
      blanks_total: blanksTotal,
      blanks_correct: blanksCorrect,
      accuracy: Number(accuracy.toFixed(1)),
      feedback,
      ...extra
    });
  } catch (e) {
    console.error('[solve/grade] error', e);
    res.status(500).json({ error: 'internal_error', detail: String(e.message || e) });
  }
});

module.exports = router;
