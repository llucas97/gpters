// backend/tests/bojSteps.test.js
'use strict';

const {
  TOTAL_STEPS,
  BUCKETS,
  clampStep,
  stepToUserLevel,
  userLevelToStepRange
} = require('../services/bojSteps');

describe('BOJ Steps 유틸리티 함수 테스트', () => {
  
  describe('기본 상수값 검증', () => {
    it('TOTAL_STEPS는 68이어야 함', () => {
      expect(TOTAL_STEPS).toBe(68);
    });

    it('BUCKETS는 6개의 레벨(0~5)을 가져야 함', () => {
      expect(BUCKETS).toHaveLength(6);
      expect(BUCKETS.map(b => b.level)).toEqual([0, 1, 2, 3, 4, 5]);
    });

    it('BUCKETS의 step 범위가 연속적이어야 함', () => {
      for (let i = 0; i < BUCKETS.length - 1; i++) {
        expect(BUCKETS[i].end + 1).toBe(BUCKETS[i + 1].start);
      }
    });

    it('BUCKETS의 전체 범위가 1부터 68까지여야 함', () => {
      expect(BUCKETS[0].start).toBe(1);
      expect(BUCKETS[BUCKETS.length - 1].end).toBe(68);
    });
  });

  describe('clampStep 함수 테스트', () => {
    it('유효한 step 값을 그대로 반환해야 함', () => {
      expect(clampStep(1)).toBe(1);
      expect(clampStep(34)).toBe(34);
      expect(clampStep(68)).toBe(68);
    });

    it('범위를 벗어난 값을 올바르게 제한해야 함', () => {
      expect(clampStep(0)).toBe(1);
      expect(clampStep(-10)).toBe(1);
      expect(clampStep(69)).toBe(68);
      expect(clampStep(100)).toBe(68);
    });

    it('문자열 숫자를 올바르게 변환해야 함', () => {
      expect(clampStep('10')).toBe(10);
      expect(clampStep('0')).toBe(1);
      expect(clampStep('100')).toBe(68);
    });

    it('잘못된 입력값을 기본값 1로 처리해야 함', () => {
      expect(clampStep(null)).toBe(1);
      expect(clampStep(undefined)).toBe(1);
      expect(clampStep('abc')).toBe(1);
    });
  });

  describe('stepToUserLevel 함수 테스트', () => {
    it('각 레벨의 step 범위를 올바르게 매핑해야 함', () => {
      // Level 0: steps 1-12
      expect(stepToUserLevel(1)).toBe(0);
      expect(stepToUserLevel(6)).toBe(0);
      expect(stepToUserLevel(12)).toBe(0);
      
      // Level 1: steps 13-24
      expect(stepToUserLevel(13)).toBe(1);
      expect(stepToUserLevel(18)).toBe(1);
      expect(stepToUserLevel(24)).toBe(1);
      
      // Level 2: steps 25-35
      expect(stepToUserLevel(25)).toBe(2);
      expect(stepToUserLevel(30)).toBe(2);
      expect(stepToUserLevel(35)).toBe(2);
      
      // Level 3: steps 36-46
      expect(stepToUserLevel(36)).toBe(3);
      expect(stepToUserLevel(41)).toBe(3);
      expect(stepToUserLevel(46)).toBe(3);
      
      // Level 4: steps 47-57
      expect(stepToUserLevel(47)).toBe(4);
      expect(stepToUserLevel(52)).toBe(4);
      expect(stepToUserLevel(57)).toBe(4);
      
      // Level 5: steps 58-68
      expect(stepToUserLevel(58)).toBe(5);
      expect(stepToUserLevel(63)).toBe(5);
      expect(stepToUserLevel(68)).toBe(5);
    });

    it('경계값에서 올바르게 동작해야 함', () => {
      expect(stepToUserLevel(12)).toBe(0);
      expect(stepToUserLevel(13)).toBe(1);
      expect(stepToUserLevel(24)).toBe(1);
      expect(stepToUserLevel(25)).toBe(2);
    });

    it('범위를 벗어난 값을 올바르게 처리해야 함', () => {
      expect(stepToUserLevel(0)).toBe(0);  // clamp되어 1이 되므로 level 0
      expect(stepToUserLevel(100)).toBe(5); // clamp되어 68이 되므로 level 5
    });
  });

  describe('userLevelToStepRange 함수 테스트', () => {
    it('각 레벨에 대해 올바른 step 범위를 반환해야 함', () => {
      expect(userLevelToStepRange(0)).toEqual({ start: 1, end: 12 });
      expect(userLevelToStepRange(1)).toEqual({ start: 13, end: 24 });
      expect(userLevelToStepRange(2)).toEqual({ start: 25, end: 35 });
      expect(userLevelToStepRange(3)).toEqual({ start: 36, end: 46 });
      expect(userLevelToStepRange(4)).toEqual({ start: 47, end: 57 });
      expect(userLevelToStepRange(5)).toEqual({ start: 58, end: 68 });
    });

    it('문자열 레벨을 올바르게 변환해야 함', () => {
      expect(userLevelToStepRange('2')).toEqual({ start: 25, end: 35 });
      expect(userLevelToStepRange('5')).toEqual({ start: 58, end: 68 });
    });

    it('범위를 벗어난 레벨을 기본값으로 처리해야 함', () => {
      expect(userLevelToStepRange(-1)).toEqual({ start: 1, end: 12 });
      expect(userLevelToStepRange(6)).toEqual({ start: 58, end: 68 });
      expect(userLevelToStepRange(10)).toEqual({ start: 58, end: 68 });
    });

    it('잘못된 입력값을 기본값으로 처리해야 함', () => {
      expect(userLevelToStepRange(null)).toEqual({ start: 1, end: 12 });
      expect(userLevelToStepRange(undefined)).toEqual({ start: 1, end: 12 });
      expect(userLevelToStepRange('abc')).toEqual({ start: 1, end: 12 });
    });
  });

  describe('레벨과 step 상호 변환 일관성 테스트', () => {
    it('level -> step range -> level 변환이 일관되어야 함', () => {
      for (let level = 0; level <= 5; level++) {
        const range = userLevelToStepRange(level);
        
        // 범위의 시작점과 끝점 모두 같은 레벨을 반환해야 함
        expect(stepToUserLevel(range.start)).toBe(level);
        expect(stepToUserLevel(range.end)).toBe(level);
        
        // 범위 중간값도 같은 레벨을 반환해야 함
        const midStep = Math.floor((range.start + range.end) / 2);
        expect(stepToUserLevel(midStep)).toBe(level);
      }
    });
  });
});
