// backend/utils/feedbackGenerator.js

/**
 * 개인화된 피드백 생성 유틸리티
 */
class FeedbackGenerator {

  /**
   * 레벨별 피드백 템플릿
   */
  static LEVEL_TEMPLATES = {
    beginner: {
      title: '초급자',
      description: '프로그래밍의 기초를 다지는 단계입니다.',
      encouragement: '차근차근 기초부터 익혀나가세요. 모든 전문가도 이 단계를 거쳤습니다!',
      nextSteps: [
        '기본 문법과 개념을 충분히 학습하세요',
        '간단한 문제부터 차근차근 풀어보세요',
        '코드를 직접 작성하며 손에 익히세요'
      ]
    },
    intermediate: {
      title: '중급자',
      description: '기본기가 탄탄하고 응용력을 기르는 단계입니다.',
      encouragement: '좋은 실력을 보여주고 있습니다. 더 복잡한 문제에 도전해보세요!',
      nextSteps: [
        '알고리즘과 자료구조를 심화 학습하세요',
        '다양한 유형의 문제를 풀어보세요',
        '코드 최적화와 효율성을 고려해보세요'
      ]
    },
    advanced: {
      title: '고급자',
      description: '뛰어난 프로그래밍 실력을 갖춘 단계입니다.',
      encouragement: '훌륭한 실력입니다! 더 도전적인 프로젝트와 문제에 도전해보세요.',
      nextSteps: [
        '복잡한 알고리즘과 고급 자료구조를 마스터하세요',
        '실제 프로젝트에 적용해보세요',
        '다른 학습자들을 도와주며 지식을 나누세요'
      ]
    }
  };

  /**
   * 레벨 배정 피드백 생성
   * @param {string} assignedLevel - 배정된 레벨
   * @param {string} previousLevel - 이전 레벨
   * @param {Object} metrics - 성과 지표
   * @param {Array} weakAreas - 약점 영역
   * @param {Array} strengths - 강점 영역
   * @returns {Object} 피드백 객체
   */
  static generateLevelFeedback(assignedLevel, previousLevel, metrics, weakAreas = [], strengths = []) {
    const template = this.LEVEL_TEMPLATES[assignedLevel];
    const levelChange = this.determineLevelChange(assignedLevel, previousLevel);
    
    let mainMessage = '';
    let levelChangeMessage = '';

    // 레벨 변경에 따른 메시지
    switch (levelChange) {
      case 'promoted':
        levelChangeMessage = `축하합니다! ${this.LEVEL_TEMPLATES[previousLevel]?.title}에서 ${template.title}로 승급하셨습니다! 🎉`;
        mainMessage = `실력이 크게 향상되었습니다. ${template.encouragement}`;
        break;
      case 'demoted':
        levelChangeMessage = `이번에는 ${this.LEVEL_TEMPLATES[previousLevel]?.title}에서 ${template.title}로 조정되었습니다.`;
        mainMessage = `괜찮습니다. 실력은 항상 변동될 수 있어요. ${template.encouragement}`;
        break;
      case 'maintained':
        levelChangeMessage = `현재 ${template.title} 레벨을 유지하고 있습니다.`;
        mainMessage = template.encouragement;
        break;
      default:
        levelChangeMessage = `${template.title} 레벨로 배정되었습니다.`;
        mainMessage = template.encouragement;
    }

    // 성과 기반 상세 피드백
    const performanceFeedback = this.generatePerformanceFeedback(metrics);
    
    // 강점과 약점 피드백
    const strengthsFeedback = this.generateStrengthsFeedback(strengths);
    const improvementFeedback = this.generateImprovementFeedback(weakAreas);

    return {
      level: assignedLevel,
      levelChange,
      title: template.title,
      
      // 메인 메시지
      mainMessage: {
        levelChange: levelChangeMessage,
        encouragement: mainMessage,
        description: template.description
      },

      // 성과 피드백
      performance: performanceFeedback,

      // 강점 피드백
      strengths: strengthsFeedback,

      // 개선 영역 피드백
      improvements: improvementFeedback,

      // 다음 단계 제안
      nextSteps: template.nextSteps,

      // 종합 요약
      summary: this.generateSummary(assignedLevel, metrics, levelChange)
    };
  }

  /**
   * 레벨 변경 상태 결정
   * @param {string} currentLevel - 현재 레벨
   * @param {string} previousLevel - 이전 레벨
   * @returns {string} 레벨 변경 상태
   */
  static determineLevelChange(currentLevel, previousLevel) {
    if (!previousLevel) return 'initial';

    const levelOrder = { beginner: 1, intermediate: 2, advanced: 3 };
    const currentOrder = levelOrder[currentLevel];
    const previousOrder = levelOrder[previousLevel];

    if (currentOrder > previousOrder) return 'promoted';
    if (currentOrder < previousOrder) return 'demoted';
    return 'maintained';
  }

  /**
   * 성과 기반 피드백 생성
   * @param {Object} metrics - 성과 지표
   * @returns {Object} 성과 피드백
   */
  static generatePerformanceFeedback(metrics) {
    const { accuracyRate, speedScore, consistencyScore, overallScore } = metrics;
    
    const feedback = {
      overall: this.getScoreFeedback(overallScore, '종합'),
      accuracy: this.getScoreFeedback(accuracyRate, '정확도'),
      speed: this.getScoreFeedback(speedScore, '속도'),
      consistency: this.getScoreFeedback(consistencyScore, '일관성')
    };

    // 가장 우수한 영역과 개선이 필요한 영역 식별
    const scores = {
      accuracy: accuracyRate,
      speed: speedScore,
      consistency: consistencyScore
    };

    const sortedScores = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    
    feedback.topPerformance = {
      area: sortedScores[0][0],
      score: sortedScores[0][1],
      message: `${this.getAreaName(sortedScores[0][0])} 영역에서 가장 우수한 성과를 보였습니다.`
    };

    feedback.needsImprovement = {
      area: sortedScores[2][0],
      score: sortedScores[2][1],
      message: `${this.getAreaName(sortedScores[2][0])} 영역에서 개선의 여지가 있습니다.`
    };

    return feedback;
  }

  /**
   * 점수별 피드백 메시지 생성
   * @param {number} score - 점수 (0-100)
   * @param {string} area - 영역명
   * @returns {Object} 피드백 객체
   */
  static getScoreFeedback(score, area) {
    let level, message, emoji;

    if (score >= 90) {
      level = 'excellent';
      message = `${area}가 매우 뛰어납니다`;
      emoji = '🌟';
    } else if (score >= 80) {
      level = 'good';
      message = `${area}가 우수합니다`;
      emoji = '👍';
    } else if (score >= 70) {
      level = 'average';
      message = `${area}가 평균 수준입니다`;
      emoji = '👌';
    } else if (score >= 60) {
      level = 'below_average';
      message = `${area}가 평균보다 약간 낮습니다`;
      emoji = '📈';
    } else {
      level = 'needs_improvement';
      message = `${area} 향상이 필요합니다`;
      emoji = '💪';
    }

    return {
      score,
      level,
      message: `${emoji} ${message} (${score}점)`,
      emoji
    };
  }

  /**
   * 강점 피드백 생성
   * @param {Array} strengths - 강점 배열
   * @returns {Object} 강점 피드백
   */
  static generateStrengthsFeedback(strengths) {
    if (!strengths || strengths.length === 0) {
      return {
        hasStrengths: false,
        message: '더 많은 문제를 풀어보시면 강점을 파악할 수 있습니다.',
        areas: []
      };
    }

    const strengthMessages = strengths.map(strength => {
      let message = '';
      
      if (strength.strength === 'high_accuracy') {
        message = `${strength.area} 영역에서 ${strength.accuracy}%의 높은 정확도를 보였습니다.`;
      } else if (strength.strength === 'fast_response') {
        message = `${strength.area} 영역에서 빠른 문제 해결 능력을 보였습니다.`;
      }

      return {
        area: strength.area,
        type: strength.strength,
        message,
        score: strength.accuracy || null
      };
    });

    return {
      hasStrengths: true,
      message: `${strengths.length}개 영역에서 강점을 보이고 있습니다! 🎯`,
      areas: strengthMessages,
      topStrength: strengthMessages[0]
    };
  }

  /**
   * 개선 영역 피드백 생성
   * @param {Array} weakAreas - 약점 영역 배열
   * @returns {Object} 개선 피드백
   */
  static generateImprovementFeedback(weakAreas) {
    if (!weakAreas || weakAreas.length === 0) {
      return {
        hasImprovements: false,
        message: '전반적으로 균형잡힌 실력을 보이고 있습니다! 👏',
        areas: []
      };
    }

    const improvementMessages = weakAreas.map(weakness => {
      let message = '';
      let suggestion = '';

      if (weakness.issue === 'low_accuracy') {
        message = `${weakness.area} 영역에서 정확도가 ${weakness.accuracy}%로 개선이 필요합니다.`;
        suggestion = `${weakness.area} 관련 기본 개념을 복습하고 연습 문제를 더 풀어보세요.`;
      } else if (weakness.issue === 'slow_response') {
        message = `${weakness.area} 영역에서 응답 시간이 다소 길어 속도 개선이 필요합니다.`;
        suggestion = `시간 제한을 두고 ${weakness.area} 문제를 반복 연습해보세요.`;
      }

      return {
        area: weakness.area,
        issue: weakness.issue,
        severity: weakness.severity,
        message,
        suggestion,
        priority: weakness.severity === 'high' ? '높음' : '보통'
      };
    });

    return {
      hasImprovements: true,
      message: `${weakAreas.length}개 영역에서 개선 기회가 있습니다. 💪`,
      areas: improvementMessages,
      topPriority: improvementMessages.find(area => area.severity === 'high') || improvementMessages[0]
    };
  }

  /**
   * 종합 요약 생성
   * @param {string} level - 레벨
   * @param {Object} metrics - 성과 지표
   * @param {string} levelChange - 레벨 변경 상태
   * @returns {string} 종합 요약
   */
  static generateSummary(level, metrics, levelChange) {
    const levelName = this.LEVEL_TEMPLATES[level].title;
    const score = Math.round(metrics.overallScore);
    
    let changeText = '';
    if (levelChange === 'promoted') {
      changeText = '레벨 승급과 함께 ';
    } else if (levelChange === 'demoted') {
      changeText = '이번 테스트에서는 ';
    }

    return `${changeText}${levelName} 레벨에서 ${score}점의 성과를 거두었습니다. ` +
           `지속적인 학습을 통해 더욱 발전할 수 있을 것입니다!`;
  }

  /**
   * 개선 영역 제안 생성
   * @param {Array} weakAreas - 약점 영역 배열
   * @returns {Array} 개선 제안 배열
   */
  static suggestImprovementAreas(weakAreas) {
    if (!weakAreas || weakAreas.length === 0) {
      return [
        {
          priority: 'low',
          suggestion: '현재 실력을 유지하며 새로운 도전을 시도해보세요.',
          action: '더 어려운 문제나 새로운 주제에 도전해보세요.'
        }
      ];
    }

    return weakAreas.map(weakness => {
      let suggestion = '';
      let action = '';

      if (weakness.issue === 'low_accuracy') {
        suggestion = `${weakness.area} 영역의 정확도 향상이 필요합니다.`;
        action = `${weakness.area} 기본 개념을 복습하고 유사한 문제를 반복 연습하세요.`;
      } else if (weakness.issue === 'slow_response') {
        suggestion = `${weakness.area} 영역에서 문제 해결 속도 개선이 필요합니다.`;
        action = `시간을 재며 ${weakness.area} 문제를 풀고, 효율적인 해결 방법을 연구하세요.`;
      }

      return {
        area: weakness.area,
        priority: weakness.severity,
        suggestion,
        action,
        expectedImprovement: this.getExpectedImprovement(weakness)
      };
    });
  }

  /**
   * 예상 개선 효과 계산
   * @param {Object} weakness - 약점 객체
   * @returns {string} 예상 개선 효과
   */
  static getExpectedImprovement(weakness) {
    if (weakness.severity === 'high') {
      return '집중적인 학습으로 2-3주 내 눈에 띄는 개선 가능';
    } else if (weakness.severity === 'medium') {
      return '꾸준한 연습으로 1-2주 내 점진적 개선 가능';
    } else {
      return '지속적인 학습으로 장기적 개선 가능';
    }
  }

  /**
   * 영역명 한국어 변환
   * @param {string} area - 영역명 (영어)
   * @returns {string} 한국어 영역명
   */
  static getAreaName(area) {
    const areaNames = {
      accuracy: '정확도',
      speed: '속도',
      consistency: '일관성',
      beginner: '기초',
      intermediate: '중급',
      advanced: '고급',
      // 카테고리별 (실제 데이터에 따라 조정 필요)
      algorithm: '알고리즘',
      datastructure: '자료구조',
      programming: '프로그래밍',
      logic: '논리',
      math: '수학'
    };

    return areaNames[area] || area;
  }
}

module.exports = FeedbackGenerator;