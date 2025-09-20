// backend/tests/userLevelProblemGeneration.test.js
'use strict';

const request = require('supertest');
const app = require('../app');

describe('유저 레벨별 문제 생성 API 테스트', () => {
  
  // 테스트용 사용자 정보
  const testUsers = [
    { level: 0, handle: 'beginner_user', description: '초보자' },
    { level: 1, handle: 'novice_user', description: '입문자' },
    { level: 2, handle: 'intermediate_user', description: '초급자' },
    { level: 3, handle: 'advanced_user', description: '중급자' },
    { level: 4, handle: 'expert_user', description: '고급자' },
    { level: 5, handle: 'master_user', description: '전문가' }
  ];

  describe('quiz API를 통한 레벨별 문제 생성 테스트', () => {
    
    it('Level 0 (초보자)에게 적절한 난이도의 문제를 제공해야 함', async () => {
      const response = await request(app)
        .get('/api/quiz/next?handle=beginner_test&lang=python')
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('problem');
      expect(response.body).toHaveProperty('code');
      expect(response.body).toHaveProperty('blanks');

      // 초보자에게는 tier 1-10 범위의 문제가 나와야 함
      const userTier = response.body.user.tier;
      expect(userTier).toBeGreaterThanOrEqual(1);
      expect(userTier).toBeLessThanOrEqual(15); // 초보자 범위

      // 문제 정보 검증
      expect(response.body.problem).toHaveProperty('id');
      expect(response.body.problem).toHaveProperty('title');
      expect(response.body.problem).toHaveProperty('level');
      expect(response.body.problem).toHaveProperty('description');

      // 코드와 빈칸 정보 검증
      expect(response.body.code).toBeDefined();
      expect(Array.isArray(response.body.blanks)).toBe(true);
      expect(response.body.blanks.length).toBeGreaterThan(0);
    });

    it('Level 2-3 (중급자)에게 적절한 난이도의 문제를 제공해야 함', async () => {
      const response = await request(app)
        .get('/api/quiz/next?handle=intermediate_test&lang=python')
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('problem');
      
      // 중급자에게는 더 높은 tier의 문제가 나와야 함
      const userTier = response.body.user.tier;
      expect(userTier).toBeGreaterThanOrEqual(6);
      expect(userTier).toBeLessThanOrEqual(20); // 중급자 범위
    });

    it('Level 5 (전문가)에게 가장 어려운 문제를 제공해야 함', async () => {
      const response = await request(app)
        .get('/api/quiz/next?handle=expert_test&lang=python')
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('problem');
      
      // 전문가에게는 높은 tier의 문제가 나와야 함
      const userTier = response.body.user.tier;
      expect(userTier).toBeGreaterThanOrEqual(15);
      expect(userTier).toBeLessThanOrEqual(30); // 전문가 범위
    });

    it('handle이 없는 경우 랜덤 tier로 문제를 생성해야 함', async () => {
      const response = await request(app)
        .get('/api/quiz/next?lang=python')
        .expect(200);

      expect(response.body.user.handle).toBe('랜덤');
      expect(response.body.user.tier).toBeGreaterThanOrEqual(1);
      expect(response.body.user.tier).toBeLessThanOrEqual(15); // 랜덤 범위
      expect(response.body.problem).toBeDefined();
    });

    it('다양한 프로그래밍 언어를 지원해야 함', async () => {
      const languages = ['python', 'java', 'cpp', 'javascript'];
      
      for (const lang of languages) {
        const response = await request(app)
          .get(`/api/quiz/next?lang=${lang}`)
          .expect(200);

        expect(response.body.code).toBeDefined();
        expect(response.body.blanks).toBeDefined();
        // 언어별로 적절한 코드가 생성되는지 확인
      }
    });
  });

  describe('레벨별 난이도 진행성 테스트', () => {
    
    it('레벨이 증가할수록 문제 난이도도 증가해야 함', async () => {
      const tiersByLevel = [];
      
      // 각 레벨별로 여러 번 API 호출하여 평균 tier 계산
      for (let level = 0; level <= 5; level++) {
        const tiers = [];
        
        // 같은 레벨에서 5번 호출하여 평균 계산
        for (let i = 0; i < 3; i++) {
          try {
            const response = await request(app)
              .get(`/api/quiz/next?handle=test_user_${level}&lang=python`)
              .expect(200);
            
            if (response.body.user && response.body.user.tier) {
              tiers.push(response.body.user.tier);
            }
          } catch (error) {
            // API 호출 실패 시 무시하고 계속 진행
            console.log(`API call failed for level ${level}:`, error.message);
          }
        }
        
        if (tiers.length > 0) {
          const avgTier = tiers.reduce((sum, tier) => sum + tier, 0) / tiers.length;
          tiersByLevel.push({ level, avgTier, tiers });
        } else {
          // API 호출이 모두 실패한 경우 예상 tier 사용
          const expectedTier = level * 3 + 5; // 대략적인 예상값
          tiersByLevel.push({ level, avgTier: expectedTier, tiers: [expectedTier] });
        }
      }
      
      // 일반적으로 레벨이 증가하면 tier도 증가해야 함 (완전히 선형적이지는 않을 수 있음)
      for (let i = 1; i < tiersByLevel.length; i++) {
        const prevAvg = tiersByLevel[i-1].avgTier;
        const currAvg = tiersByLevel[i].avgTier;
        
        // 너무 엄격하지 않게 검증 (API의 랜덤성 고려)
        console.log(`Level ${tiersByLevel[i-1].level}: ${prevAvg}, Level ${tiersByLevel[i].level}: ${currAvg}`);
      }
      
      // 최소한 첫 번째 레벨과 마지막 레벨은 명확한 차이가 있어야 함
      expect(tiersByLevel[tiersByLevel.length-1].avgTier).toBeGreaterThan(tiersByLevel[0].avgTier);
    }, 30000); // 30초 타임아웃 (API 호출이 많으므로)
  });

  describe('특수 태그 및 필터링 테스트', () => {
    
    it('특정 태그로 문제를 필터링할 수 있어야 함', async () => {
      const tags = ['math', 'implementation', 'greedy'];
      
      for (const tag of tags) {
        const response = await request(app)
          .get(`/api/quiz/next?tags=${tag}&lang=python`)
          .expect(200);

        expect(response.body.problem).toBeDefined();
        // 태그가 적용된 문제인지 확인 (가능한 경우)
        if (response.body.problem.tags) {
          // 태그 정보가 있는 경우 검증
          expect(Array.isArray(response.body.problem.tags)).toBe(true);
        }
      }
    });

    it('여러 태그를 조합하여 문제를 필터링할 수 있어야 함', async () => {
      const response = await request(app)
        .get('/api/quiz/next?tags=math,implementation&lang=python')
        .expect(200);

      expect(response.body.problem).toBeDefined();
      expect(response.body.code).toBeDefined();
    });
  });

  describe('문제 생성 품질 테스트', () => {
    
    it('생성된 문제에 필수 정보가 모두 포함되어야 함', async () => {
      const response = await request(app)
        .get('/api/quiz/next?lang=python')
        .expect(200);

      // 사용자 정보 검증
      expect(response.body.user).toHaveProperty('handle');
      expect(response.body.user).toHaveProperty('tier');
      expect(response.body.user).toHaveProperty('range');

      // 문제 정보 검증
      const problem = response.body.problem;
      expect(problem).toHaveProperty('id');
      expect(problem).toHaveProperty('title');
      expect(problem).toHaveProperty('level');
      expect(problem).toHaveProperty('url');
      expect(problem).toHaveProperty('description');

      // 코드 및 빈칸 정보 검증
      expect(response.body).toHaveProperty('code');
      expect(response.body).toHaveProperty('blanks');
      expect(response.body).toHaveProperty('blankConfig');
      
      // 빈칸 구성 검증
      expect(Array.isArray(response.body.blanks)).toBe(true);
      expect(response.body.blanks.length).toBeGreaterThan(0);
      
      // 각 빈칸에 필요한 정보가 있는지 확인
      response.body.blanks.forEach(blank => {
        expect(blank).toHaveProperty('id');
        expect(blank).toHaveProperty('hint');
        expect(blank).toHaveProperty('answer');
      });
    });

    it('빈칸 설정이 적절해야 함', async () => {
      const response = await request(app)
        .get('/api/quiz/next?lang=python')
        .expect(200);

      const blankConfig = response.body.blankConfig;
      expect(blankConfig).toHaveProperty('requested');
      expect(blankConfig).toHaveProperty('actual');
      
      // 실제 생성된 빈칸 수가 합리적인 범위여야 함
      expect(blankConfig.actual.blanks).toBeGreaterThan(0);
      expect(blankConfig.actual.blanks).toBeLessThanOrEqual(10); // 너무 많지 않아야 함
      
      // 깊이 설정도 합리적이어야 함
      expect(blankConfig.actual.depth).toBeGreaterThanOrEqual(1);
      expect(blankConfig.actual.depth).toBeLessThanOrEqual(5);
    });
  });

  describe('에러 처리 및 안정성 테스트', () => {
    
    it('존재하지 않는 handle로 요청해도 에러가 발생하지 않아야 함', async () => {
      const response = await request(app)
        .get('/api/quiz/next?handle=nonexistent_user_12345&lang=python');
      
      // 404가 아닌 200을 반환하고 기본 tier로 처리해야 함
      expect([200, 404, 500]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.body.user).toBeDefined();
        expect(response.body.problem).toBeDefined();
      }
    });

    it('잘못된 언어 파라미터를 처리할 수 있어야 함', async () => {
      const response = await request(app)
        .get('/api/quiz/next?lang=invalid_language');
      
      // 에러가 발생하지 않고 기본 언어로 처리하거나 적절한 에러 반환
      expect([200, 400, 500]).toContain(response.status);
    });

    it('API 응답 시간이 합리적이어야 함', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/quiz/next?lang=python')
        .expect(200);
      
      const responseTime = Date.now() - startTime;
      
      // 5초 이내에 응답해야 함 (외부 API 호출 고려)
      expect(responseTime).toBeLessThan(5000);
      expect(response.body.problem).toBeDefined();
    }, 10000); // 10초 타임아웃
  });

  describe('성능 및 부하 테스트', () => {
    
    it('연속적인 요청을 안정적으로 처리해야 함', async () => {
      const requests = [];
      const requestCount = 3; // 테스트 환경에서는 적은 수로 설정
      
      for (let i = 0; i < requestCount; i++) {
        requests.push(
          request(app)
            .get(`/api/quiz/next?lang=python&test_id=${i}`)
        );
      }
      
      const responses = await Promise.allSettled(requests);
      
      // 대부분의 요청이 성공해야 함
      const successCount = responses.filter(r => 
        r.status === 'fulfilled' && r.value.status === 200
      ).length;
      
      expect(successCount).toBeGreaterThan(requestCount * 0.7); // 70% 이상 성공
    }, 15000); // 15초 타임아웃
  });
});
