'use strict';

const express = require('express');
const router = express.Router();
const db = require('../models');
const { Op, Sequelize } = require('sequelize');

/**
 * POST /api/analytics/log
 * body: {
 *   handle, language, topic, level, source, problem_id,
 *   started_at?, finished_at?, duration_ms?,
 *   blanks_total, blanks_correct,
 *   blanks_detail: [{id, user, answer, correct}]
 * }
 */
router.post('/log', async (req, res) => {
  try {
    if (!db?.StudySession) return res.status(503).json({ error: 'db_unavailable' });

    const {
      handle = null, client_id = null, user_id = null, language, topic, level, source = 'bank', problem_id = null,
      started_at = new Date(), finished_at = new Date(), duration_ms = null,
      blanks_total, blanks_correct, blanks_detail
    } = req.body || {};

    // 로그인된 사용자의 경우 user_id 우선 사용
    const finalUserId = user_id || (req.user ? req.user.user_id : null);
    const finalHandle = handle || (req.user ? req.user.username : 'anonymous');

    if ((!finalHandle && !client_id && !finalUserId) || !language || !topic || !level || !blanks_total || blanks_correct == null || !Array.isArray(blanks_detail)) {
      return res.status(400).json({ error: 'bad_request', detail: 'need user_id/handle/client_id + required fields' });
    }

    const row = await db.StudySession.create({
      user_id: finalUserId,
      handle: finalHandle,
      client_id, language, topic, level, source, problem_id,
      started_at, finished_at, duration_ms,
      blanks_total, blanks_correct, blanks_detail
    });

    res.json({ ok: true, id: row.id });
  } catch (e) {
    console.error('[analytics/log] error', e);
    res.status(500).json({ error: 'internal_error', detail: String(e.message || e) });
  }
});

/**
 * GET /api/analytics/summary?handle=koosaga&from=2025-09-01&to=2025-09-30
 * 반환: totals, perTopic, perLevel, recent
 */
router.get('/summary', async (req, res) => {
  try {
    if (!db?.StudySession) return res.status(503).json({ error: 'db_unavailable' });
    const { handle = null, client_id = null, user_id = null } = req.query;
    
    // 로그인된 사용자의 경우 자동으로 user_id 사용
    const finalUserId = user_id || (req.user ? req.user.user_id : null);
    
    if (!handle && !client_id && !finalUserId) {
      return res.status(400).json({ error: 'bad_request', detail: 'user_id, handle or client_id required' });
    }

    const from = req.query.from ? new Date(String(req.query.from)) : new Date('1970-01-01');
    const to   = req.query.to   ? new Date(String(req.query.to))   : new Date(Date.now() + 24*3600*1000);

    const where = {
      ...(finalUserId ? { user_id: finalUserId } : handle ? { handle } : { client_id }),
      created_at: { [Op.between]: [from, to] }
    };

    // totals
    const totals = await db.StudySession.findOne({
      where,
      attributes: [
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'sessions'],
        [Sequelize.fn('AVG', Sequelize.col('accuracy')), 'avg_accuracy'],
        [Sequelize.fn('AVG', Sequelize.col('duration_ms')), 'avg_duration_ms'],
        [Sequelize.fn('SUM', Sequelize.col('blanks_total')), 'blanks_total'],
        [Sequelize.fn('SUM', Sequelize.col('blanks_correct')), 'blanks_correct']
      ],
      raw: true
    });

    // per topic
    const perTopic = await db.StudySession.findAll({
      where,
      attributes: [
        'topic',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'sessions'],
        [Sequelize.fn('AVG', Sequelize.col('accuracy')), 'accuracy']
      ],
      group: ['topic'],
      order: [[Sequelize.literal('accuracy'), 'ASC']],
      raw: true
    });

    // per level
    const perLevel = await db.StudySession.findAll({
      where,
      attributes: [
        'level',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'sessions'],
        [Sequelize.fn('AVG', Sequelize.col('accuracy')), 'accuracy']
      ],
      group: ['level'],
      order: [['level', 'ASC']],
      raw: true
    });

    // 최근 10개
    const recent = await db.StudySession.findAll({
      where,
      order: [['created_at', 'DESC']],
      limit: 10
    });

    res.json({ totals, perTopic, perLevel, recent });
  } catch (e) {
    console.error('[analytics/summary] error', e);
    res.status(500).json({ error: 'internal_error', detail: String(e.message || e) });
  }
});

/**
 * GET /api/analytics/timeseries?handle=koosaga&bucket=day&from=...&to=...
 * day/week 버킷별 정확도/시도수
 */
router.get('/timeseries', async (req, res) => {
  try {
    if (!db?.StudySession) return res.status(503).json({ error: 'db_unavailable' });
    const { handle = null, client_id = null, user_id = null } = req.query;
    
    // 로그인된 사용자의 경우 자동으로 user_id 사용
    const finalUserId = user_id || (req.user ? req.user.user_id : null);
    
    if (!handle && !client_id && !finalUserId) {
      return res.status(400).json({ error: 'bad_request', detail: 'user_id, handle or client_id required' });
    }

    const bucket = (req.query.bucket || 'day').toString().toLowerCase(); // day|week
    const from = req.query.from ? new Date(String(req.query.from)) : new Date('1970-01-01');
    const to   = req.query.to   ? new Date(String(req.query.to))   : new Date(Date.now() + 24*3600*1000);
    
    const keyCol = finalUserId ? 'user_id' : handle ? 'handle' : 'client_id';
    const keyVal = finalUserId || handle || client_id;

    // MySQL 8: DATE(created_at) or YEARWEEK(created_at)
    const groupExpr = bucket === 'week' ? 'YEARWEEK(created_at, 3)' : 'DATE(created_at)';
    const [rows] = await db.sequelize.query(
      `
      SELECT ${groupExpr} AS bucket,
             COUNT(id) AS sessions,
             AVG(accuracy) AS accuracy,
             SUM(blanks_total) AS blanks_total,
             SUM(blanks_correct) AS blanks_correct
      FROM study_sessions
      WHERE ${keyCol} = :keyVal
        AND created_at BETWEEN :from AND :to
      GROUP BY ${groupExpr}
      ORDER BY ${groupExpr} ASC
      `,
      { replacements: { keyVal, from, to } }
    );

    res.json({ bucket, items: rows });
  } catch (e) {
    console.error('[analytics/timeseries] error', e);
    res.status(500).json({ error: 'internal_error', detail: String(e.message || e) });
  }
});

module.exports = router;
