'use strict';

const { StudySession, sequelize } = require('../models');
const { Op } = require('sequelize');

/**
 * 채점 결과 저장 및 관리 서비스
 */
class GradingResultService {
  
  /**
   * 채점 결과 저장
   * @param {Object} data - 저장할 데이터
   * @returns {Promise<Object>} 저장된 결과
   */
  static async saveGradingResult(data) {
    try {
      console.log('[GradingResultService] 채점 결과 저장 시작:', {
        userId: data.userId,
        problemId: data.problemId,
        problemType: data.problemType,
        level: data.level,
        score: data.score,
        isCorrect: data.isCorrect
      });
      
      const {
        userId,
        problemId,
        problemType,
        level,
        problemTitle,
        problemDescription,
        userAnswer,
        gradingResult,
        score,
        isCorrect,
        correctCount,
        totalCount,
        feedback,
        timeSpent,
        language = 'javascript',
        topic = 'programming'
      } = data;
      
      // 기존 시도 횟수 확인
      const existingAttempts = await StudySession.count({
        where: {
          user_id: userId,
          problem_id: problemId
        }
      });
      
      const attemptCount = existingAttempts + 1;
      const isFirstAttempt = attemptCount === 1;
      
      // StudySession에 저장
      const studySession = await StudySession.create({
        user_id: userId,
        handle: `user_${userId}`, // 임시 handle
        client_id: `client_${userId}`,
        language,
        topic,
        level,
        problem_id: problemId,
        problem_type: problemType,
        problem_title: problemTitle,
        problem_description: problemDescription,
        started_at: new Date(),
        finished_at: new Date(),
        duration_ms: timeSpent ? timeSpent * 1000 : null,
        blanks_total: totalCount,
        blanks_correct: correctCount,
        accuracy: totalCount > 0 ? (correctCount / totalCount) * 100 : 0,
        blanks_detail: gradingResult?.results || [],
        score,
        is_correct: isCorrect,
        user_answer: userAnswer,
        grading_result: gradingResult,
        feedback,
        attempt_count: attemptCount,
        is_first_attempt: isFirstAttempt
      });
      
      console.log('[GradingResultService] 채점 결과 저장 완료:', {
        sessionId: studySession.id,
        attemptCount,
        isFirstAttempt
      });
      
      return {
        success: true,
        sessionId: studySession.id,
        attemptCount,
        isFirstAttempt,
        data: studySession
      };
      
    } catch (error) {
      console.error('[GradingResultService] 채점 결과 저장 오류:', error);
      throw error;
    }
  }
  
  /**
   * 사용자의 문제 풀이 기록 조회
   * @param {string} userId - 사용자 ID
   * @param {Object} options - 조회 옵션
   * @returns {Promise<Object>} 풀이 기록
   */
  static async getUserProblemHistory(userId, options = {}) {
    try {
      console.log('[GradingResultService] 사용자 문제 풀이 기록 조회:', { userId, options });
      
      const {
        problemType,
        level,
        isCorrect,
        limit = 50,
        offset = 0,
        startDate,
        endDate
      } = options;
      
      const whereClause = { user_id: userId };
      
      if (problemType) whereClause.problem_type = problemType;
      if (level !== undefined) whereClause.level = level;
      if (isCorrect !== undefined) whereClause.is_correct = isCorrect;
      
      if (startDate || endDate) {
        whereClause.started_at = {};
        if (startDate) whereClause.started_at[Op.gte] = new Date(startDate);
        if (endDate) whereClause.started_at[Op.lte] = new Date(endDate);
      }
      
      const { count, rows } = await StudySession.findAndCountAll({
        where: whereClause,
        order: [['started_at', 'DESC']],
        limit,
        offset
      });
      
      // 통계 계산
      const stats = await this.calculateUserStats(userId, options);
      
      console.log('[GradingResultService] 풀이 기록 조회 완료:', {
        totalCount: count,
        returnedCount: rows.length,
        stats
      });
      
      return {
        success: true,
        totalCount: count,
        records: rows,
        stats
      };
      
    } catch (error) {
      console.error('[GradingResultService] 풀이 기록 조회 오류:', error);
      throw error;
    }
  }
  
  /**
   * 사용자 통계 계산
   * @param {string} userId - 사용자 ID
   * @param {Object} options - 필터 옵션
   * @returns {Promise<Object>} 통계 정보
   */
  static async calculateUserStats(userId, options = {}) {
    try {
      const whereClause = { user_id: userId };
      
      if (options.problemType) whereClause.problem_type = options.problemType;
      if (options.level !== undefined) whereClause.level = options.level;
      
      // 전체 통계
      const totalProblems = await StudySession.count({ where: whereClause });
      const correctProblems = await StudySession.count({ 
        where: { ...whereClause, is_correct: true } 
      });
      const averageScore = await StudySession.findOne({
        where: whereClause,
        attributes: [
          [sequelize.fn('AVG', sequelize.col('score')), 'avgScore'],
          [sequelize.fn('AVG', sequelize.col('accuracy')), 'avgAccuracy']
        ],
        raw: true
      });
      
      // 레벨별 통계
      const levelStats = await StudySession.findAll({
        where: whereClause,
        attributes: [
          'level',
          [sequelize.fn('COUNT', sequelize.col('id')), 'totalCount'],
          [sequelize.fn('SUM', sequelize.literal('CASE WHEN is_correct = true THEN 1 ELSE 0 END')), 'correctCount'],
          [sequelize.fn('AVG', sequelize.col('score')), 'avgScore']
        ],
        group: ['level'],
        order: [['level', 'ASC']],
        raw: true
      });
      
      // 문제 유형별 통계
      const typeStats = await StudySession.findAll({
        where: whereClause,
        attributes: [
          'problem_type',
          [sequelize.fn('COUNT', sequelize.col('id')), 'totalCount'],
          [sequelize.fn('SUM', sequelize.literal('CASE WHEN is_correct = true THEN 1 ELSE 0 END')), 'correctCount'],
          [sequelize.fn('AVG', sequelize.col('score')), 'avgScore']
        ],
        group: ['problem_type'],
        raw: true
      });
      
      const avgScoreValue = parseFloat(averageScore?.avgScore) || 0;
      const avgAccuracyValue = parseFloat(averageScore?.avgAccuracy) || 0;
      
      return {
        totalProblems,
        correctProblems,
        accuracy: Number((totalProblems > 0 ? (correctProblems / totalProblems) * 100 : 0).toFixed(1)),
        averageScore: Number(avgScoreValue.toFixed(1)),
        averageAccuracy: Number(avgAccuracyValue.toFixed(1)),
        levelStats,
        typeStats
      };
      
    } catch (error) {
      console.error('[GradingResultService] 통계 계산 오류:', error);
      throw error;
    }
  }
  
  /**
   * 문제별 풀이 기록 조회
   * @param {string} problemId - 문제 ID
   * @param {Object} options - 조회 옵션
   * @returns {Promise<Object>} 문제 풀이 기록
   */
  static async getProblemHistory(problemId, options = {}) {
    try {
      console.log('[GradingResultService] 문제별 풀이 기록 조회:', { problemId, options });
      
      const { limit = 50, offset = 0 } = options;
      
      const { count, rows } = await StudySession.findAndCountAll({
        where: { problem_id: problemId },
        order: [['started_at', 'DESC']],
        limit,
        offset
      });
      
      return {
        success: true,
        totalCount: count,
        records: rows
      };
      
    } catch (error) {
      console.error('[GradingResultService] 문제별 풀이 기록 조회 오류:', error);
      throw error;
    }
  }
  
  /**
   * 사용자의 레벨별 성취도 조회
   * @param {string} userId - 사용자 ID
   * @returns {Promise<Object>} 레벨별 성취도
   */
  static async getUserLevelProgress(userId) {
    try {
      console.log('[GradingResultService] 레벨별 성취도 조회:', { userId });
      
      const levelProgress = await StudySession.findAll({
        where: { user_id: userId },
        attributes: [
          'level',
          [sequelize.fn('COUNT', sequelize.col('id')), 'totalProblems'],
          [sequelize.fn('SUM', sequelize.literal('CASE WHEN is_correct = true THEN 1 ELSE 0 END')), 'correctProblems'],
          [sequelize.fn('AVG', sequelize.col('score')), 'averageScore'],
          [sequelize.fn('AVG', sequelize.col('accuracy')), 'averageAccuracy']
        ],
        group: ['level'],
        order: [['level', 'ASC']],
        raw: true
      });
      
      return {
        success: true,
        levelProgress
      };
      
    } catch (error) {
      console.error('[GradingResultService] 레벨별 성취도 조회 오류:', error);
      throw error;
    }
  }
}

module.exports = GradingResultService;
