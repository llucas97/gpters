// backend/tests/bojApi.test.js
'use strict';

const request = require('supertest');
const app = require('../app');

describe('BOJ API 통합 테스트', () => {
  
  describe('GET /api/boj/health', () => {
    it('헬스체크가 올바른 정보를 반환해야 함', async () => {
      const response = await request(app)
        .get('/api/boj/health')
        .expect(200);

      expect(response.body).toHaveProperty('total_steps');
      expect(response.body).toHaveProperty('buckets');
      expect(response.body.total_steps).toBe(68);
      expect(response.body.buckets).toHaveLength(6);
    });
  });

  describe('GET /api/boj/step-level', () => {
    it('유효한 step으로 올바른 level을 반환해야 함', async () => {
      // Level 0 테스트 (steps 1-12)
      const response1 = await request(app)
        .get('/api/boj/step-level?step=5')
        .expect(200);
      
      expect(response1.body.step).toBe(5);
      expect(response1.body.level).toBe(0);

      // Level 3 테스트 (steps 36-46)
      const response2 = await request(app)
        .get('/api/boj/step-level?step=40')
        .expect(200);
      
      expect(response2.body.step).toBe(40);
      expect(response2.body.level).toBe(3);

      // Level 5 테스트 (steps 58-68)
      const response3 = await request(app)
        .get('/api/boj/step-level?step=65')
        .expect(200);
      
      expect(response3.body.step).toBe(65);
      expect(response3.body.level).toBe(5);
    });

    it('경계값에서 올바르게 동작해야 함', async () => {
      // Level 0과 1의 경계
      const response1 = await request(app)
        .get('/api/boj/step-level?step=12')
        .expect(200);
      expect(response1.body.level).toBe(0);

      const response2 = await request(app)
        .get('/api/boj/step-level?step=13')
        .expect(200);
      expect(response2.body.level).toBe(1);
    });

    it('범위를 벗어난 step을 올바르게 처리해야 함', async () => {
      // 너무 작은 값
      const response1 = await request(app)
        .get('/api/boj/step-level?step=0')
        .expect(200);
      expect(response1.body.step).toBe(0);
      expect(response1.body.level).toBe(0); // clamp되어 step 1이 되므로 level 0

      // 너무 큰 값
      const response2 = await request(app)
        .get('/api/boj/step-level?step=100')
        .expect(200);
      expect(response2.body.step).toBe(100);
      expect(response2.body.level).toBe(5); // clamp되어 step 68이 되므로 level 5
    });

    it('step 파라미터가 없으면 기본값을 사용해야 함', async () => {
      const response = await request(app)
        .get('/api/boj/step-level')
        .expect(200);
      
      expect(response.body.step).toBeDefined();
      expect(response.body.level).toBeDefined();
    });
  });

  describe('GET /api/boj/step-range', () => {
    it('유효한 level로 올바른 step 범위를 반환해야 함', async () => {
      // Level 0 테스트
      const response0 = await request(app)
        .get('/api/boj/step-range?level=0')
        .expect(200);
      
      expect(response0.body.level).toBe(0);
      expect(response0.body.range).toEqual({ start: 1, end: 12 });

      // Level 2 테스트
      const response2 = await request(app)
        .get('/api/boj/step-range?level=2')
        .expect(200);
      
      expect(response2.body.level).toBe(2);
      expect(response2.body.range).toEqual({ start: 25, end: 35 });

      // Level 5 테스트
      const response5 = await request(app)
        .get('/api/boj/step-range?level=5')
        .expect(200);
      
      expect(response5.body.level).toBe(5);
      expect(response5.body.range).toEqual({ start: 58, end: 68 });
    });

    it('모든 레벨(0-5)에 대해 유효한 범위를 반환해야 함', async () => {
      for (let level = 0; level <= 5; level++) {
        const response = await request(app)
          .get(`/api/boj/step-range?level=${level}`)
          .expect(200);
        
        expect(response.body.level).toBe(level);
        expect(response.body.range).toHaveProperty('start');
        expect(response.body.range).toHaveProperty('end');
        expect(response.body.range.start).toBeGreaterThan(0);
        expect(response.body.range.end).toBeLessThanOrEqual(68);
        expect(response.body.range.start).toBeLessThanOrEqual(response.body.range.end);
      }
    });

    it('범위를 벗어난 level을 올바르게 처리해야 함', async () => {
      // 너무 작은 값
      const response1 = await request(app)
        .get('/api/boj/step-range?level=-1')
        .expect(200);
      expect(response1.body.level).toBe(-1);
      expect(response1.body.range).toEqual({ start: 1, end: 12 }); // 기본값

      // 너무 큰 값
      const response2 = await request(app)
        .get('/api/boj/step-range?level=10')
        .expect(200);
      expect(response2.body.level).toBe(10);
      expect(response2.body.range).toEqual({ start: 58, end: 68 }); // 최대값으로 clamp
    });

    it('level 파라미터가 없으면 기본값을 사용해야 함', async () => {
      const response = await request(app)
        .get('/api/boj/step-range')
        .expect(200);
      
      expect(response.body.level).toBeDefined();
      expect(response.body.range).toBeDefined();
    });
  });

  describe('유저 레벨별 문제 생성 시나리오 테스트', () => {
    it('초보자(Level 0)에게 적절한 step 범위를 제공해야 함', async () => {
      const userLevel = 0;
      const response = await request(app)
        .get(`/api/boj/step-range?level=${userLevel}`)
        .expect(200);
      
      expect(response.body.range.start).toBe(1);
      expect(response.body.range.end).toBe(12);
      
      // 이 범위의 문제들이 초보자에게 적합한지 확인
      const stepCount = response.body.range.end - response.body.range.start + 1;
      expect(stepCount).toBe(12); // 초보자에게 충분한 문제 수
    });

    it('중급자(Level 2-3)에게 적절한 step 범위를 제공해야 함', async () => {
      // Level 2 테스트
      const response2 = await request(app)
        .get('/api/boj/step-range?level=2')
        .expect(200);
      
      expect(response2.body.range.start).toBe(25);
      expect(response2.body.range.end).toBe(35);

      // Level 3 테스트
      const response3 = await request(app)
        .get('/api/boj/step-range?level=3')
        .expect(200);
      
      expect(response3.body.range.start).toBe(36);
      expect(response3.body.range.end).toBe(46);
      
      // 중급자 범위가 연속적이어야 함
      expect(response3.body.range.start).toBe(response2.body.range.end + 1);
    });

    it('고급자(Level 5)에게 가장 어려운 step 범위를 제공해야 함', async () => {
      const userLevel = 5;
      const response = await request(app)
        .get(`/api/boj/step-range?level=${userLevel}`)
        .expect(200);
      
      expect(response.body.range.start).toBe(58);
      expect(response.body.range.end).toBe(68);
      
      // 최고 난이도 범위인지 확인
      expect(response.body.range.end).toBe(68); // 최대 step
    });

    it('레벨별 난이도 진행이 일관되어야 함', async () => {
      const levels = [0, 1, 2, 3, 4, 5];
      const ranges = [];
      
      // 모든 레벨의 범위를 수집
      for (const level of levels) {
        const response = await request(app)
          .get(`/api/boj/step-range?level=${level}`)
          .expect(200);
        ranges.push(response.body.range);
      }
      
      // 각 레벨의 시작점이 이전 레벨의 끝점 + 1이어야 함 (연속성)
      for (let i = 1; i < ranges.length; i++) {
        expect(ranges[i].start).toBe(ranges[i-1].end + 1);
      }
      
      // 난이도가 증가해야 함 (step 번호가 증가)
      for (let i = 1; i < ranges.length; i++) {
        expect(ranges[i].start).toBeGreaterThan(ranges[i-1].start);
        expect(ranges[i].end).toBeGreaterThan(ranges[i-1].end);
      }
    });
  });

  describe('에러 처리 테스트', () => {
    it('잘못된 문자열 파라미터를 올바르게 처리해야 함', async () => {
      const response1 = await request(app)
        .get('/api/boj/step-level?step=abc')
        .expect(200);
      expect(response1.body.level).toBeDefined(); // 기본값으로 처리

      const response2 = await request(app)
        .get('/api/boj/step-range?level=xyz')
        .expect(200);
      expect(response2.body.range).toBeDefined(); // 기본값으로 처리
    });
  });
});
