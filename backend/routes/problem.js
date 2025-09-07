// backend/routes/problem.js
const express = require('express');
const router = express.Router();
const { Problem } = require('../models');
const { verifyTokenMiddleware } = require('../auth/middleware');

// 모든 문제 조회 (페이지네이션 포함)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const difficulty = req.query.difficulty;
    const category = req.query.category;

    const whereClause = {};
    if (difficulty) whereClause.difficulty_level = difficulty;
    if (category) whereClause.category = category;

    const { count, rows } = await Problem.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [['created_at', 'DESC']],
    });

    return res.status(200).json({
      message: '문제 목록 조회 성공',
      data: {
        problems: rows,
        pagination: {
          total: count,
          page,
          limit,
          totalPages: Math.ceil(count / limit),
        },
      },
    });
  } catch (err) {
    console.error('❌ problems list error:', err);
    return res.status(500).json({ message: '서버 오류', error: err.message });
  }
});

// 특정 문제 조회
router.get('/:problemId', async (req, res) => {
  try {
    const { problemId } = req.params;

    const problem = await Problem.findByPk(problemId);

    if (!problem) {
      return res.status(404).json({ message: '문제를 찾을 수 없습니다.' });
    }

    return res.status(200).json({
      message: '문제 조회 성공',
      data: problem,
    });
  } catch (err) {
    console.error('❌ problem detail error:', err);
    return res.status(500).json({ message: '서버 오류', error: err.message });
  }
});

// 새 문제 생성 (관리자용)
router.post('/', verifyTokenMiddleware, async (req, res) => {
  try {
    const {
      title,
      description,
      difficulty_level,
      category,
      input_format,
      output_format,
      constraints,
      sample_input,
      sample_output,
      time_limit,
      memory_limit,
      tags,
    } = req.body;

    if (!title || !description) {
      return res.status(400).json({ message: '제목과 설명은 필수입니다.' });
    }

    const newProblem = await Problem.create({
      title,
      description,
      difficulty_level: difficulty_level || 'easy',
      category,
      input_format,
      output_format,
      constraints,
      sample_input,
      sample_output,
      time_limit: time_limit || 1000,
      memory_limit: memory_limit || 256,
      tags: tags || [],
    });

    return res.status(201).json({
      message: '문제 생성 성공',
      data: newProblem,
    });
  } catch (err) {
    console.error('❌ problem creation error:', err);
    return res.status(500).json({ message: '서버 오류', error: err.message });
  }
});

// 문제 수정 (관리자용)
router.put('/:problemId', verifyTokenMiddleware, async (req, res) => {
  try {
    const { problemId } = req.params;
    const updateData = req.body;

    const problem = await Problem.findByPk(problemId);

    if (!problem) {
      return res.status(404).json({ message: '문제를 찾을 수 없습니다.' });
    }

    await problem.update(updateData);

    return res.status(200).json({
      message: '문제 수정 성공',
      data: problem,
    });
  } catch (err) {
    console.error('❌ problem update error:', err);
    return res.status(500).json({ message: '서버 오류', error: err.message });
  }
});

// 문제 삭제 (관리자용)
router.delete('/:problemId', verifyTokenMiddleware, async (req, res) => {
  try {
    const { problemId } = req.params;

    const problem = await Problem.findByPk(problemId);

    if (!problem) {
      return res.status(404).json({ message: '문제를 찾을 수 없습니다.' });
    }

    await problem.destroy();

    return res.status(200).json({
      message: '문제 삭제 성공',
    });
  } catch (err) {
    console.error('❌ problem deletion error:', err);
    return res.status(500).json({ message: '서버 오류', error: err.message });
  }
});

// 난이도별 문제 통계
router.get('/stats/difficulty', async (req, res) => {
  try {
    const stats = await Problem.findAll({
      attributes: [
        'difficulty_level',
        [sequelize.fn('COUNT', sequelize.col('problem_id')), 'count'],
      ],
      group: ['difficulty_level'],
    });

    return res.status(200).json({
      message: '난이도별 통계 조회 성공',
      data: stats,
    });
  } catch (err) {
    console.error('❌ difficulty stats error:', err);
    return res.status(500).json({ message: '서버 오류', error: err.message });
  }
});

module.exports = router;