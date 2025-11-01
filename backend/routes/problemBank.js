'use strict';

const express = require('express');
const router = express.Router();
const db = require('../models');
const { Op } = require('sequelize');
const { generateProblem } = require('../services/openaiProblemGen');
// const { generateCodeOrderingProblem } = require('../services/openaiCodeOrdering');
// const { generateBugFixProblem } = require('../services/openaiDebugFix');
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

    // 레벨 4-5는 템플릿 코드와 테스트 케이스 저장
    if (level === 4 || level === 5) {
      dbData.metadata = {
        type: 'template_code',
        templateCode: payload.templateCode || payload.code_template || '',
        testCases: payload.testCases || [],
        instruction: payload.instruction || '빈 줄에 코드를 작성하세요.',
        blankCount: level === 4 ? 1 : 2
      };
    }

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

// 코드 검증 API (레벨 4-5용)
router.post('/validate-code', async (req, res) => {
  try {
    if (!guardDb(req, res)) return;
    
    const { problemId, userCode, language } = req.body;
    
    if (!problemId || !userCode || !language) {
      return res.status(400).json({ 
        error: 'Missing required fields: problemId, userCode, language' 
      });
    }
    
    // 문제 정보 조회
    const problem = await db.ProblemBank.findByPk(problemId);
    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }
    
    // 메타데이터에서 테스트 케이스 추출
    const metadata = problem.metadata || {};
    const testCases = metadata.testCases || [];
    
    if (testCases.length === 0) {
      return res.status(400).json({ 
        error: 'No test cases found for this problem' 
      });
    }
    
    console.log(`[problem-bank/validate-code] 검증 시작 - 문제 ID: ${problemId}, 언어: ${language}`);
    console.log(`[problem-bank/validate-code] 테스트 케이스 개수: ${testCases.length}`);
    
    // 코드 검증 실행
    const validationResult = CodeValidator.validate(language, userCode, testCases);
    
    // 결과 로그
    console.log(`[problem-bank/validate-code] 검증 완료:`, {
      success: validationResult.success,
      allPassed: validationResult.allPassed,
      score: validationResult.score
    });
    
    res.json({
      success: true,
      validation: validationResult,
      problemTitle: problem.title
    });
    
  } catch (error) {
    console.error('[problem-bank/validate-code] error:', error);
    res.status(500).json({ 
      error: 'internal_error', 
      detail: String(error.message || error) 
    });
  }
});

module.exports = router;
