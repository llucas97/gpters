const express = require('express');
const router = express.Router();
const db = require('../models');

/**
 * POST /api/problem-evaluation/rate
 * 문제 평가 제출
 */
router.post('/rate', async (req, res) => {
  try {
    const { userId, problemId, rating, feedback } = req.body;

    // 유효성 검사
    if (!userId || !problemId) {
      return res.status(400).json({
        success: false,
        error: '사용자 ID와 문제 ID는 필수입니다.'
      });
    }

    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({
        success: false,
        error: '평가 점수는 1~5 사이여야 합니다.'
      });
    }

    // 기존 평가 확인
    const existingEvaluation = await db.ProblemEvaluation.findOne({
      where: { user_id: userId, problem_id: problemId }
    });

    let evaluation;
    if (existingEvaluation) {
      // 기존 평가 업데이트
      await existingEvaluation.update({
        rating: rating || existingEvaluation.rating,
        feedback: feedback || existingEvaluation.feedback
      });
      evaluation = existingEvaluation;
    } else {
      // 새 평가 생성
      evaluation = await db.ProblemEvaluation.create({
        user_id: userId,
        problem_id: problemId,
        rating: rating || null,
        feedback: feedback || null,
        is_reported: false
      });
    }

    res.json({
      success: true,
      message: '평가가 제출되었습니다.',
      data: evaluation
    });
  } catch (error) {
    console.error('평가 제출 오류:', error);
    res.status(500).json({
      success: false,
      error: '평가 제출 중 오류가 발생했습니다.',
      details: error.message
    });
  }
});

/**
 * POST /api/problem-evaluation/report
 * 문제 신고
 */
router.post('/report', async (req, res) => {
  try {
    const { userId, problemId, reportReason } = req.body;

    // 유효성 검사
    if (!userId || !problemId || !reportReason) {
      return res.status(400).json({
        success: false,
        error: '사용자 ID, 문제 ID, 신고 사유는 필수입니다.'
      });
    }

    // 기존 평가 확인
    const existingEvaluation = await db.ProblemEvaluation.findOne({
      where: { user_id: userId, problem_id: problemId }
    });

    let evaluation;
    if (existingEvaluation) {
      // 기존 평가에 신고 추가
      await existingEvaluation.update({
        is_reported: true,
        report_reason: reportReason
      });
      evaluation = existingEvaluation;
    } else {
      // 신고만 있는 새 레코드 생성
      evaluation = await db.ProblemEvaluation.create({
        user_id: userId,
        problem_id: problemId,
        is_reported: true,
        report_reason: reportReason
      });
    }

    // 관리자 알림 (콘솔 로그)
    console.log('🚨 [문제 신고 알림] 🚨');
    console.log(`사용자 ID: ${userId}`);
    console.log(`문제 ID: ${problemId}`);
    console.log(`신고 사유: ${reportReason}`);
    console.log(`신고 시각: ${new Date().toISOString()}`);
    console.log('================================');

    // TODO: 실제 프로덕션에서는 이메일, Slack, Discord 등으로 관리자에게 알림 전송

    res.json({
      success: true,
      message: '신고가 접수되었습니다. 관리자가 검토할 예정입니다.',
      data: evaluation
    });
  } catch (error) {
    console.error('문제 신고 오류:', error);
    res.status(500).json({
      success: false,
      error: '신고 처리 중 오류가 발생했습니다.',
      details: error.message
    });
  }
});

/**
 * GET /api/problem-evaluation/:problemId/stats
 * 문제별 평가 통계
 */
router.get('/:problemId/stats', async (req, res) => {
  try {
    const { problemId } = req.params;

    const evaluations = await db.ProblemEvaluation.findAll({
      where: { problem_id: problemId },
      attributes: ['rating', 'is_reported']
    });

    const totalRatings = evaluations.filter(e => e.rating).length;
    const avgRating = totalRatings > 0
      ? evaluations.reduce((sum, e) => sum + (e.rating || 0), 0) / totalRatings
      : 0;
    const totalReports = evaluations.filter(e => e.is_reported).length;

    res.json({
      success: true,
      data: {
        totalRatings,
        avgRating: Math.round(avgRating * 100) / 100,
        totalReports
      }
    });
  } catch (error) {
    console.error('평가 통계 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '통계 조회 중 오류가 발생했습니다.'
    });
  }
});

module.exports = router;

