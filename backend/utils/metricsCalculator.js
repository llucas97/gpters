// backend/utils/metricsCalculator.js

/**
 * 테스트 결과 분석을 위한 메트릭 계산 유틸리티
 */
class MetricsCalculator {
  
  /**
   * 정답률 계산 (submissions 테이블 기반)
   * @param {Array} submissions - 사용자 제출 배열
   * @returns {number} 정답률 (0-100)
   */
  static calculateAccuracyRate(submissions) {
    if (!submissions || submissions.length === 0) {
      return 0;
    }

    const correctAnswers = submissions.filter(submission => submission.result === 'correct').length;
    const totalAnswers = submissions.length;
    
    return Math.round((correctAnswers / totalAnswers) * 100 * 100) / 100; // 소수점 2자리
  }

  /**
   * 평균 응답 시간 계산 (submissions 테이블 기반)
   * @param {Array} submissions - 사용자 제출 배열
   * @returns {number} 평균 응답 시간 (밀리초)
   */
  static calculateAverageResponseTime(submissions) {
    if (!submissions || submissions.length === 0) {
      return 0;
    }

    const totalTime = submissions.reduce((sum, submission) => {
      return sum + (submission.execution_time_ms || 0);
    }, 0);

    return Math.round(totalTime / submissions.length);
  }

  /**
   * 일관성 점수 계산 (응답 시간의 표준편차 기반)
   * @param {Array} submissions - 사용자 제출 배열
   * @returns {number} 일관성 점수 (0-100, 높을수록 일관성 있음)
   */
  static calculateConsistencyScore(submissions) {
    if (!submissions || submissions.length < 2) {
      return 100; // 데이터가 부족하면 완벽한 일관성으로 간주
    }

    const responseTimes = submissions.map(s => s.execution_time_ms || 0);
    const mean = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    
    // 표준편차 계산
    const variance = responseTimes.reduce((sum, time) => {
      return sum + Math.pow(time - mean, 2);
    }, 0) / responseTimes.length;
    
    const standardDeviation = Math.sqrt(variance);
    
    // 변동계수 (CV) 계산: 표준편차 / 평균
    const coefficientOfVariation = mean > 0 ? standardDeviation / mean : 0;
    
    // 일관성 점수: CV가 낮을수록 높은 점수 (최대 100점)
    const consistencyScore = Math.max(0, 100 - (coefficientOfVariation * 100));
    
    return Math.round(consistencyScore * 100) / 100;
  }

  /**
   * 가중치 적용 종합 점수 계산
   * @param {number} accuracy - 정답률 (0-100)
   * @param {number} speed - 속도 점수 (0-100)
   * @param {number} consistency - 일관성 점수 (0-100)
   * @param {Object} weights - 가중치 객체 {accuracy, speed, consistency}
   * @returns {number} 종합 점수 (0-100)
   */
  static calculateWeightedScore(accuracy, speed, consistency, weights = null) {
    // 기본 가중치: 정확도 40%, 속도 30%, 일관성 30%
    const defaultWeights = {
      accuracy: 0.4,
      speed: 0.3,
      consistency: 0.3
    };

    const finalWeights = weights || defaultWeights;
    
    const weightedScore = (
      accuracy * finalWeights.accuracy +
      speed * finalWeights.speed +
      consistency * finalWeights.consistency
    );

    return Math.round(weightedScore * 100) / 100;
  }

  /**
   * 응답 시간을 속도 점수로 변환
   * @param {number} averageTime - 평균 응답 시간 (밀리초)
   * @param {number} expectedTime - 예상 응답 시간 (밀리초, 기본값: 30초)
   * @returns {number} 속도 점수 (0-100)
   */
  static calculateSpeedScore(averageTime, expectedTime = 30000) {
    if (averageTime <= 0) return 100;
    
    // 예상 시간보다 빠르면 100점, 2배 느리면 0점
    const ratio = averageTime / expectedTime;
    const speedScore = Math.max(0, 100 - ((ratio - 1) * 50));
    
    return Math.round(speedScore * 100) / 100;
  }

  /**
   * 이상값 탐지 (IQR 방법 사용)
   * @param {Array} dataPoints - 데이터 포인트 배열
   * @returns {Array} 이상값 배열
   */
  static detectOutliers(dataPoints) {
    if (!dataPoints || dataPoints.length < 4) {
      return [];
    }

    const sorted = [...dataPoints].sort((a, b) => a - b);
    const q1Index = Math.floor(sorted.length * 0.25);
    const q3Index = Math.floor(sorted.length * 0.75);
    
    const q1 = sorted[q1Index];
    const q3 = sorted[q3Index];
    const iqr = q3 - q1;
    
    const lowerBound = q1 - (1.5 * iqr);
    const upperBound = q3 + (1.5 * iqr);
    
    return dataPoints.filter(point => point < lowerBound || point > upperBound);
  }

  /**
   * 점수 정규화 (0-100 범위로 조정)
   * @param {Array} scores - 점수 배열
   * @returns {Array} 정규화된 점수 배열
   */
  static normalizeScores(scores) {
    if (!scores || scores.length === 0) {
      return [];
    }

    const min = Math.min(...scores);
    const max = Math.max(...scores);
    
    if (min === max) {
      return scores.map(() => 100); // 모든 값이 같으면 100점
    }

    return scores.map(score => {
      const normalized = ((score - min) / (max - min)) * 100;
      return Math.round(normalized * 100) / 100;
    });
  }

  /**
   * 오답 패턴 분석 (submissions 테이블 기반)
   * @param {Array} submissions - 사용자 제출 배열
   * @returns {Object} 오답 패턴 분석 결과
   */
  static analyzeIncorrectAnswers(submissions) {
    if (!submissions || submissions.length === 0) {
      return {
        totalIncorrect: 0,
        incorrectRate: 0,
        commonMistakes: [],
        difficultyPattern: {},
        errorTypes: {}
      };
    }

    const incorrectSubmissions = submissions.filter(s => s.result !== 'correct');
    const totalIncorrect = incorrectSubmissions.length;
    const incorrectRate = (totalIncorrect / submissions.length) * 100;

    // 난이도별 오답 패턴 분석
    const difficultyPattern = {};
    incorrectSubmissions.forEach(submission => {
      const difficulty = submission.problem?.difficulty || 'unknown';
      difficultyPattern[difficulty] = (difficultyPattern[difficulty] || 0) + 1;
    });

    // 에러 타입별 분석
    const errorTypes = {};
    incorrectSubmissions.forEach(submission => {
      const errorType = submission.result;
      errorTypes[errorType] = (errorTypes[errorType] || 0) + 1;
    });

    // 가장 어려워한 문제들 (점수가 낮은 문제들)
    const commonMistakes = incorrectSubmissions
      .sort((a, b) => a.score - b.score)
      .slice(0, 5)
      .map(s => ({
        problemId: s.problem_id,
        score: s.score,
        result: s.result,
        executionTime: s.execution_time_ms
      }));

    return {
      totalIncorrect,
      incorrectRate: Math.round(incorrectRate * 100) / 100,
      commonMistakes,
      difficultyPattern,
      errorTypes
    };
  }

  /**
   * 성과 트렌드 분석 (submissions 테이블 기반)
   * @param {Array} submissions - 시간순으로 정렬된 제출 배열
   * @returns {Object} 트렌드 분석 결과
   */
  static analyzeTrend(submissions) {
    if (!submissions || submissions.length < 3) {
      return {
        trend: 'insufficient_data',
        improvement: 0,
        consistency: 'unknown'
      };
    }

    // 시간 순으로 정렬
    const sortedSubmissions = [...submissions].sort((a, b) => 
      new Date(a.submitted_at) - new Date(b.submitted_at)
    );

    // 전반부와 후반부 성과 비교
    const midPoint = Math.floor(sortedSubmissions.length / 2);
    const firstHalf = sortedSubmissions.slice(0, midPoint);
    const secondHalf = sortedSubmissions.slice(midPoint);

    const firstHalfAccuracy = this.calculateAccuracyRate(firstHalf);
    const secondHalfAccuracy = this.calculateAccuracyRate(secondHalf);

    const improvement = secondHalfAccuracy - firstHalfAccuracy;
    
    let trend;
    if (improvement > 10) trend = 'improving';
    else if (improvement < -10) trend = 'declining';
    else trend = 'stable';

    return {
      trend,
      improvement: Math.round(improvement * 100) / 100,
      firstHalfAccuracy,
      secondHalfAccuracy
    };
  }
}

module.exports = MetricsCalculator;