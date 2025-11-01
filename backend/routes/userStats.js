const express = require('express');
const router = express.Router();
const GradingResultService = require('../services/gradingResultService');

/**
 * GET /api/user-stats/:userId/overview
 * 사용자 전체 통계 개요 조회
 */
router.get('/:userId/overview', async (req, res) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate } = req.query;
    
    console.log('[UserStats API] 사용자 전체 통계 조회:', { userId, startDate, endDate });
    
    const options = {
      startDate,
      endDate
    };
    
    const stats = await GradingResultService.calculateUserStats(userId, options);
    
    // 추가 통계 계산
    const additionalStats = {
      totalProblems: stats.totalProblems,
      correctProblems: stats.correctProblems,
      accuracy: Number(Number(stats.accuracy || 0).toFixed(1)),
      averageScore: Number(Number(stats.averageScore || 0).toFixed(1)),
      averageAccuracy: Number(Number(stats.averageAccuracy || 0).toFixed(1)),
      
      // 레벨별 통계
      levelBreakdown: stats.levelStats.map(level => ({
        level: level.level,
        totalProblems: parseInt(level.totalCount),
        correctProblems: parseInt(level.correctCount),
        accuracy: Number((level.totalCount > 0 ? (level.correctCount / level.totalCount) * 100 : 0).toFixed(1)),
        averageScore: Number((parseFloat(level.avgScore) || 0).toFixed(1))
      })),
      
      // 문제 유형별 통계
      typeBreakdown: stats.typeStats.map(type => ({
        problemType: type.problem_type,
        totalProblems: parseInt(type.totalCount),
        correctProblems: parseInt(type.correctCount),
        accuracy: Number((type.totalCount > 0 ? (type.correctCount / type.totalCount) * 100 : 0).toFixed(1)),
        averageScore: Number((parseFloat(type.avgScore) || 0).toFixed(1))
      })),
      
      // Topic별 통계 추가
      topicBreakdown: stats.topicStats.map(topic => ({
        topic: topic.topic,
        totalProblems: parseInt(topic.totalCount),
        correctProblems: parseInt(topic.correctCount),
        accuracy: topic.totalCount > 0 ? (topic.correctCount / topic.totalCount) * 100 : 0,
        averageScore: parseFloat(topic.avgScore) || 0
      })),
      
      // 최근 활동 (최근 7일)
      recentActivity: await getRecentActivity(userId, 7),
      
      // 성취도 등급
      achievementLevel: calculateAchievementLevel(stats.accuracy)
    };
    
    console.log('[UserStats API] recentActivity 포함된 통계:', {
      hasRecentActivity: !!additionalStats.recentActivity,
      recentActivity: additionalStats.recentActivity
    });
    
    res.json({
      success: true,
      stats: additionalStats,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[UserStats API] 전체 통계 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '통계 조회 중 오류가 발생했습니다',
      details: error.message
    });
  }
});

/**
 * GET /api/user-stats/:userId/level/:level
 * 특정 레벨의 상세 통계 조회
 */
router.get('/:userId/level/:level', async (req, res) => {
  try {
    const { userId, level } = req.params;
    const { startDate, endDate } = req.query;
    
    console.log('[UserStats API] 레벨별 상세 통계 조회:', { userId, level, startDate, endDate });
    
    const options = {
      level: parseInt(level),
      startDate,
      endDate
    };
    
    const result = await GradingResultService.getUserProblemHistory(userId, options);
    
    // 레벨별 상세 분석
    const levelAnalysis = {
      level: parseInt(level),
      totalProblems: result.totalCount,
      correctProblems: result.records.filter(r => r.is_correct).length,
      accuracy: Number((result.totalCount > 0 ? (result.records.filter(r => r.is_correct).length / result.totalCount) * 100 : 0).toFixed(1)),
      averageScore: Number((result.records.reduce((sum, r) => sum + (r.score || 0), 0) / result.totalCount || 0).toFixed(1)),
      
      // 문제 유형별 분석
      typeAnalysis: analyzeByType(result.records),
      
      // 시간대별 분석
      timeAnalysis: analyzeByTime(result.records),
      
      // 최근 문제들
      recentProblems: result.records.slice(0, 10).map(record => ({
        id: record.id,
        problemTitle: record.problem_title,
        problemType: record.problem_type,
        score: record.score,
        isCorrect: record.is_correct,
        startedAt: record.started_at,
        duration: record.duration_ms
      }))
    };
    
    res.json({
      success: true,
      analysis: levelAnalysis,
      records: result.records,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[UserStats API] 레벨별 통계 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '레벨별 통계 조회 중 오류가 발생했습니다',
      details: error.message
    });
  }
});

/**
 * GET /api/user-stats/:userId/type/:problemType
 * 특정 문제 유형의 상세 통계 조회
 */
router.get('/:userId/type/:problemType', async (req, res) => {
  try {
    const { userId, problemType } = req.params;
    const { startDate, endDate } = req.query;
    
    console.log('[UserStats API] 유형별 상세 통계 조회:', { userId, problemType, startDate, endDate });
    
    const options = {
      problemType,
      startDate,
      endDate
    };
    
    const result = await GradingResultService.getUserProblemHistory(userId, options);
    
    // 유형별 상세 분석
    const typeAnalysis = {
      problemType,
      totalProblems: result.totalCount,
      correctProblems: result.records.filter(r => r.is_correct).length,
      accuracy: Number((result.totalCount > 0 ? (result.records.filter(r => r.is_correct).length / result.totalCount) * 100 : 0).toFixed(1)),
      averageScore: Number((result.records.reduce((sum, r) => sum + (r.score || 0), 0) / result.totalCount || 0).toFixed(1)),
      
      // 레벨별 분석
      levelAnalysis: analyzeByLevel(result.records),
      
      // 시간대별 분석
      timeAnalysis: analyzeByTime(result.records),
      
      // 최근 문제들
      recentProblems: result.records.slice(0, 10).map(record => ({
        id: record.id,
        problemTitle: record.problem_title,
        level: record.level,
        score: record.score,
        isCorrect: record.is_correct,
        startedAt: record.started_at,
        duration: record.duration_ms
      }))
    };
    
    res.json({
      success: true,
      analysis: typeAnalysis,
      records: result.records,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[UserStats API] 유형별 통계 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '유형별 통계 조회 중 오류가 발생했습니다',
      details: error.message
    });
  }
});

/**
 * GET /api/user-stats/:userId/achievements
 * 사용자 성취도 및 뱃지 조회
 */
router.get('/:userId/achievements', async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log('[UserStats API] 성취도 조회:', { userId });
    
    const stats = await GradingResultService.calculateUserStats(userId);
    const levelProgress = await GradingResultService.getUserLevelProgress(userId);
    
    // 성취도 및 뱃지 계산
    const achievements = calculateAchievements(stats, levelProgress);
    
    res.json({
      success: true,
      achievements,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[UserStats API] 성취도 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '성취도 조회 중 오류가 발생했습니다',
      details: error.message
    });
  }
});

// === 헬퍼 함수들 ===

/**
 * 최근 활동 조회
 */
async function getRecentActivity(userId, days) {
  try {
    // userId를 문자열로 변환
    const userIdString = String(userId);
    
    // 오늘 날짜의 마지막 시간까지 포함 (23:59:59.999)
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    
    // 7일 전 자정부터 시작
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);
    
    const options = {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      limit: 1000, // 충분히 큰 값으로 설정하여 모든 데이터 가져오기
      offset: 0
    };
    
    console.log('[getRecentActivity] 최근 활동 조회 시작:', { 
      userId: userIdString, 
      days, 
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      dateRangeDays: Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))
    });
    
    const result = await GradingResultService.getUserProblemHistory(userIdString, options);
    
    console.log('[getRecentActivity] 조회 결과:', { 
      totalCount: result.totalCount, 
      recordsLength: result.records?.length || 0 
    });
    
    // 평균 점수 계산 수정
    const totalCount = result.totalCount || 0;
    const records = result.records || [];
    const totalScore = records.reduce((sum, r) => sum + (r.score || 0), 0);
    const averageScore = totalCount > 0 ? totalScore / totalCount : 0;
    const correctProblems = records.filter(r => r.is_correct).length;
    
    const activityData = {
      period: `${days}일`,
      totalProblems: totalCount,
      correctProblems: correctProblems,
      averageScore: Math.round(averageScore * 100) / 100 // 소수점 2자리로 반올림
    };
    
    console.log('[getRecentActivity] 반환 데이터:', activityData);
    
    return activityData;
    
  } catch (error) {
    console.error('[getRecentActivity] 오류:', error);
    // 에러 발생 시 기본값 반환
    return {
      period: `${days}일`,
      totalProblems: 0,
      correctProblems: 0,
      averageScore: 0
    };
  }
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const options = {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0]
  };
  
  const result = await GradingResultService.getUserProblemHistory(userId, options);
  
  return {
    period: `${days}일`,
    totalProblems: result.totalCount,
    correctProblems: result.records.filter(r => r.is_correct).length,
    averageScore: Number((result.records.reduce((sum, r) => sum + (r.score || 0), 0) / result.totalCount || 0).toFixed(1))
  };
}

/**
 * 성취도 등급 계산
 */
function calculateAchievementLevel(accuracy) {
  if (accuracy >= 90) return { level: 'S', name: '마스터', color: '#FFD700' };
  if (accuracy >= 80) return { level: 'A', name: '고수', color: '#FF6B6B' };
  if (accuracy >= 70) return { level: 'B', name: '숙련자', color: '#4ECDC4' };
  if (accuracy >= 60) return { level: 'C', name: '학습자', color: '#45B7D1' };
  return { level: 'D', name: '초보자', color: '#96CEB4' };
}

/**
 * 문제 유형별 분석
 */
function analyzeByType(records) {
  const typeMap = {};
  
  records.forEach(record => {
    const type = record.problem_type;
    if (!typeMap[type]) {
      typeMap[type] = { total: 0, correct: 0, totalScore: 0 };
    }
    typeMap[type].total++;
    if (record.is_correct) typeMap[type].correct++;
    typeMap[type].totalScore += record.score || 0;
  });
  
  return Object.keys(typeMap).map(type => ({
    problemType: type,
    totalProblems: typeMap[type].total,
    correctProblems: typeMap[type].correct,
    accuracy: Number((typeMap[type].total > 0 ? (typeMap[type].correct / typeMap[type].total) * 100 : 0).toFixed(1)),
    averageScore: Number((typeMap[type].total > 0 ? typeMap[type].totalScore / typeMap[type].total : 0).toFixed(1))
  }));
}

/**
 * 레벨별 분석
 */
function analyzeByLevel(records) {
  const levelMap = {};
  
  records.forEach(record => {
    const level = record.level;
    if (!levelMap[level]) {
      levelMap[level] = { total: 0, correct: 0, totalScore: 0 };
    }
    levelMap[level].total++;
    if (record.is_correct) levelMap[level].correct++;
    levelMap[level].totalScore += record.score || 0;
  });
  
  return Object.keys(levelMap).map(level => ({
    level: parseInt(level),
    totalProblems: levelMap[level].total,
    correctProblems: levelMap[level].correct,
    accuracy: Number((levelMap[level].total > 0 ? (levelMap[level].correct / levelMap[level].total) * 100 : 0).toFixed(1)),
    averageScore: Number((levelMap[level].total > 0 ? levelMap[level].totalScore / levelMap[level].total : 0).toFixed(1))
  }));
}

/**
 * 시간대별 분석
 */
function analyzeByTime(records) {
  const timeMap = {};
  
  records.forEach(record => {
    const hour = new Date(record.started_at).getHours();
    const timeSlot = Math.floor(hour / 4) * 4; // 4시간 단위로 그룹화
    
    if (!timeMap[timeSlot]) {
      timeMap[timeSlot] = { total: 0, correct: 0, totalScore: 0 };
    }
    timeMap[timeSlot].total++;
    if (record.is_correct) timeMap[timeSlot].correct++;
    timeMap[timeSlot].totalScore += record.score || 0;
  });
  
  return Object.keys(timeMap).map(timeSlot => ({
    timeSlot: `${timeSlot}:00-${parseInt(timeSlot) + 4}:00`,
    totalProblems: timeMap[timeSlot].total,
    correctProblems: timeMap[timeSlot].correct,
    accuracy: Number((timeMap[timeSlot].total > 0 ? (timeMap[timeSlot].correct / timeMap[timeSlot].total) * 100 : 0).toFixed(1)),
    averageScore: Number((timeMap[timeSlot].total > 0 ? timeMap[timeSlot].totalScore / timeMap[timeSlot].total : 0).toFixed(1))
  }));
}

/**
 * 성취도 및 뱃지 계산
 */
function calculateAchievements(stats, levelProgress) {
  const achievements = [];
  
  // 기본 성취도
  if (stats.totalProblems >= 10) {
    achievements.push({ id: 'first_10', name: '첫 10문제', description: '10문제를 풀었습니다', earned: true });
  }
  if (stats.totalProblems >= 50) {
    achievements.push({ id: 'first_50', name: '50문제 달성', description: '50문제를 풀었습니다', earned: true });
  }
  if (stats.totalProblems >= 100) {
    achievements.push({ id: 'first_100', name: '100문제 달성', description: '100문제를 풀었습니다', earned: true });
  }
  
  // 정확도 성취도
  if (stats.accuracy >= 80) {
    achievements.push({ id: 'accuracy_80', name: '정확도 80%', description: '80% 이상의 정확도를 달성했습니다', earned: true });
  }
  if (stats.accuracy >= 90) {
    achievements.push({ id: 'accuracy_90', name: '정확도 90%', description: '90% 이상의 정확도를 달성했습니다', earned: true });
  }
  
  // 레벨별 성취도
  levelProgress.levelProgress.forEach(level => {
    if (level.totalProblems >= 5) {
      achievements.push({ 
        id: `level_${level.level}_5`, 
        name: `레벨 ${level.level} 마스터`, 
        description: `레벨 ${level.level}에서 5문제 이상을 풀었습니다`, 
        earned: true 
      });
    }
  });
  
  return {
    totalAchievements: achievements.length,
    achievements,
    nextGoals: generateNextGoals(stats, levelProgress)
  };
}

/**
 * 다음 목표 생성
 */
function generateNextGoals(stats, levelProgress) {
  const goals = [];
  
  if (stats.totalProblems < 10) {
    goals.push({ type: 'problems', target: 10, current: stats.totalProblems, description: '10문제 풀기' });
  } else if (stats.totalProblems < 50) {
    goals.push({ type: 'problems', target: 50, current: stats.totalProblems, description: '50문제 풀기' });
  }
  
  if (stats.accuracy < 80) {
    goals.push({ type: 'accuracy', target: 80, current: stats.accuracy, description: '정확도 80% 달성' });
  }
  
  return goals;
}

module.exports = router;
