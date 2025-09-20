// backend/tests/setup.js
// Jest 테스트 설정 파일

// 환경 변수 설정
process.env.NODE_ENV = 'test';

// 테스트용 환경 변수들
process.env.PORT = '3001';

// 콘솔 로그 최소화 (필요한 경우에만)
if (process.env.JEST_VERBOSE !== 'true') {
  console.log = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
}

// 테스트 타임아웃 설정
jest.setTimeout(30000); // 30초

// 전역 테스트 설정
beforeAll(async () => {
  // 테스트 시작 전 초기화 작업
  console.info = jest.fn(); // console.info를 목 함수로 교체
});

afterAll(async () => {
  // 테스트 종료 후 정리 작업
});

// 각 테스트 전후 실행될 작업들
beforeEach(() => {
  // 각 테스트 전 초기화
});

afterEach(() => {
  // 각 테스트 후 정리
});
