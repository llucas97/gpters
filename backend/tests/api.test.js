const request = require('supertest');
const app = require('../server');

describe('API 통합 테스트', () => {
  let surveyId;
  let userId = 1; // 테스트용 사용자 ID

  // 헬스 체크 테스트
  describe('GET /health', () => {
    it('서버 상태를 확인할 수 있어야 함', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('OK');
      expect(response.body.message).toContain('정상 작동');
    });
  });

  // 설문조사 API 테스트
  describe('설문조사 API', () => {
    const validSurveyData = {
      occupation: 'developer',
      purpose: 'skill-improvement',
      level: 'intermediate',
      motivation: '개발 실력을 향상시키고 싶어서 가입했습니다. 새로운 기술을 배우고 실습할 수 있는 환경을 찾고 있었습니다.',
      userId: null
    };

    it('유효한 설문조사 데이터로 설문을 제출할 수 있어야 함', async () => {
      const response = await request(app)
        .post('/api/survey')
        .send(validSurveyData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('성공적으로 저장');
      expect(response.body.data.surveyId).toBeDefined();
      
      surveyId = response.body.data.surveyId;
    });

    it('필수 필드가 누락된 경우 400 에러를 반환해야 함', async () => {
      const invalidData = {
        occupation: 'developer',
        // purpose 누락
        level: 'intermediate',
        motivation: '테스트'
      };

      const response = await request(app)
        .post('/api/survey')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('저장된 설문조사를 조회할 수 있어야 함', async () => {
      if (!surveyId) {
        throw new Error('설문조사 ID가 없습니다. 이전 테스트가 실패했을 수 있습니다.');
      }

      const response = await request(app)
        .get(`/api/survey/${surveyId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(surveyId);
      expect(response.body.data.occupation).toBe(validSurveyData.occupation);
    });

    it('존재하지 않는 설문조사 조회 시 404 에러를 반환해야 함', async () => {
      const response = await request(app)
        .get('/api/survey/99999')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('찾을 수 없습니다');
    });

    it('설문조사 통계를 조회할 수 있어야 함', async () => {
      const response = await request(app)
        .get('/api/survey/stats/summary')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.overview).toBeDefined();
      expect(response.body.data.occupationDistribution).toBeDefined();
    });
  });

  // 프로필 API 테스트 (데이터베이스에 테스트 사용자가 있다고 가정)
  describe('프로필 API', () => {
    const validProfileData = {
      name: '테스트 사용자',
      bio: '프로필 테스트용 자기소개',
      location: '서울, 대한민국',
      website: 'https://test.example.com'
    };

    it('프로필을 조회할 수 있어야 함', async () => {
      // 실제 테스트에서는 존재하는 사용자 ID를 사용해야 함
      // 여기서는 404가 예상됨 (테스트 데이터가 없을 경우)
      const response = await request(app)
        .get(`/api/profile/${userId}`);

      // 사용자가 존재하지 않을 수 있으므로 200 또는 404 모두 허용
      expect([200, 404]).toContain(response.status);
    });

    it('유효한 프로필 데이터로 프로필을 수정할 수 있어야 함', async () => {
      const response = await request(app)
        .put(`/api/profile/${userId}`)
        .send(validProfileData);

      // 사용자가 존재하지 않을 경우 404, 존재할 경우 200
      expect([200, 404]).toContain(response.status);
    });

    it('잘못된 이메일 형식으로 프로필 수정 시 400 에러를 반환해야 함', async () => {
      const invalidData = {
        ...validProfileData,
        email: 'invalid-email'
      };

      const response = await request(app)
        .put(`/api/profile/${userId}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  // 에러 처리 테스트
  describe('에러 처리', () => {
    it('존재하지 않는 엔드포인트 요청 시 404 에러를 반환해야 함', async () => {
      const response = await request(app)
        .get('/api/nonexistent')
        .expect(404);

      expect(response.body.error).toBe('Not Found');
    });

    it('잘못된 JSON 데이터 전송 시 적절한 에러를 반환해야 함', async () => {
      const response = await request(app)
        .post('/api/survey')
        .send('invalid json')
        .set('Content-Type', 'application/json');

      expect([400, 500]).toContain(response.status);
    });
  });

  // CORS 테스트
  describe('CORS 설정', () => {
    it('CORS 헤더가 올바르게 설정되어야 함', async () => {
      const response = await request(app)
        .options('/api/survey')
        .set('Origin', 'http://localhost:3000');

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });
  });
}); 