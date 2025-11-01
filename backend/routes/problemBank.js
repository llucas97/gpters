'use strict';

const express = require('express');
const router = express.Router();
const db = require('../models');
const { Op } = require('sequelize');
const { generateProblem } = require('../services/openaiProblemGen');
const CodeValidator = require('../services/codeValidator');

function guardDb(req, res) {
  if (!db?.ProblemBank) {
    res.status(503).json({ error: 'db_unavailable' });
    return false;
  }
  return true;
}

router.post('/generate', async (req, res) => {
  try {
    if (!guardDb(req, res)) return;
    const level    = Number(req.body?.level || 10);
    const topic    = String(req.body?.topic || 'graph');
    const language = String(req.body?.language || 'python');

    console.log(`[problem-bank/generate] Level: ${level}, Topic: ${topic}, Language: ${language}`);

    let payload;

    // 레벨별로 다른 문제 생성 로직 사용
    console.log('[problem-bank/generate] Using template code generation for all levels');
    // 최근 생성된 문제들의 제목을 가져와서 중복 방지에 활용
    const recentProblems = await db.ProblemBank.findAll({
      where: { level, topic, language },
      order: [['id', 'DESC']],
      limit: 10,
      attributes: ['title']
    });
    const recentTitles = recentProblems.map(p => p.title);
    payload = await generateProblem({ level, topic, language, recentTitles });

    // 데이터베이스 저장용 필드 정규화
    const dbData = {
      source: 'openai',
      title: payload.title,
      level: payload.level,
      topic: payload.topic,
      language: payload.language,
      statement: payload.description || payload.statement || '',
      input_spec: payload.input_spec || '',
      output_spec: payload.output_spec || '',
      constraints: payload.constraints || '',
      examples: payload.examples || [],
      code: payload.code || payload.correctCode || payload.buggyCode || '',
      blanks: payload.blanks || []
    };

    const created = await db.ProblemBank.create(dbData);

    res.json({ id: created.id, ...payload });
  } catch (e) {
    console.error('[problem-bank/generate] error:', e);
    res.status(500).json({ error: 'internal_error', detail: String(e.message || e) });
  }
});

router.get('/', async (req, res) => {
  try {
    if (!guardDb(req, res)) return;

    const { level, topic, language, q } = req.query;
    const limit  = Math.min(Math.max(parseInt(req.query.limit  ?? '20', 10), 1), 100);
    const offset = Math.max(parseInt(req.query.offset ?? '0', 10), 0);

    const where = {};
    if (level)    where.level    = Number(level);
    if (topic)    where.topic    = String(topic);
    if (language) where.language = String(language);
    if (q)        where.title    = { [Op.like]: `%${String(q)}%` };

    const rows = await db.ProblemBank.findAll({
      where,
      order: [['id', 'DESC']],
      limit,
      offset
    });

    res.json({ items: rows, limit, offset });
  } catch (e) {
    res.status(500).json({ error: 'internal_error', detail: String(e.message || e) });
  }
});

router.get('/:id', async (req, res) => {
  try {
    if (!guardDb(req, res)) return;

    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id <= 0) {
      return res.status(400).json({ error: 'bad_request', detail: 'invalid id' });
    }
    const row = await db.ProblemBank.findByPk(id);
    if (!row) return res.status(404).json({ error: 'not_found' });
    res.json(row);
  } catch (e) {
    res.status(500).json({ error: 'internal_error', detail: String(e.message || e) });
  }
});

// 레거시: 코드 검증 API 제거됨 (레벨 4-5가 키워드/메소드 입력 방식으로 변경됨)

module.exports = router;
