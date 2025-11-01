# gpters

<div align="center">

**AI 기반 알고리즘 학습 플랫폼**

문제 생성 · 풀이 · 채점을 한 곳에서

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen)](https://nodejs.org/)
[![React](https://img.shields.io/badge/react-18.x-blue)](https://reactjs.org/)

[데모](#) · [문서](#) · [이슈 신고](../../issues)

</div>

---

## 📖 목차

- [소개](#-소개)
- [차별성](#-차별성)
- [주요 기능](#-주요-기능)
- [기술 스택](#-기술-스택)
- [시스템 아키텍처](#-시스템-아키텍처)
- [시작하기](#-시작하기)
- [레벨별 학습 시스템](#-레벨별-학습-시스템)
- [채점 시스템](#-채점-시스템)
- [API 문서](#-api-문서)
- [로드맵](#-로드맵)
- [기여하기](#-기여하기)
- [라이선스](#-라이선스)

---

## 🎯 소개

**gpters**는 알고리즘 문제를 자동으로 생성하고 채점하는 AI 기반 교육 플랫폼입니다. 

### 핵심 가치

- **🔄 무한한 학습 콘텐츠**: OpenAI API를 활용한 자동 문제 생성으로 무제한 학습 가능
- **🎯 개인화된 학습 경로**: 사용자의 수준에 맞춘 맞춤형 학습 경험 제공
- **⚡ 즉각적인 피드백**: 레벨별 맞춤 채점 규칙으로 실시간 피드백 제공

---

## 🚀 차별성

### 세계 최초! 레벨별 맞춤형 인터페이스

gpters는 학습자의 수준에 따라 **완전히 다른 학습 인터페이스**를 제공하는 유일무이한 플랫폼입니다.

| 구분 | 기존 플랫폼 | gpters |
|------|-----------|--------|
| 문제 제공 | 고정된 문제 세트 | ✨ AI 무한 문제 생성 |
| 인터페이스 | 단일 코드 에디터 | ✨ 3가지 레벨별 맞춤 인터페이스 |
| 학습 대상 | 코딩 경험자 중심 | ✨ 초보자부터 전문가까지 |
| 학습 경험 | 일률적인 접근 | ✨ 완전한 개인화 학습 경로 |

**블록 코딩 → 클로즈 → 코드 에디터** 단계별 성장 지원

---

## ✨ 주요 기능

### 🤖 AI 문제 생성
- 레벨과 주제를 선택하면 자동으로 문제 생성
- 다양한 난이도와 유형의 문제 제공
- 학습자의 수준에 맞춘 문제 추천

### 🎯 레벨별 풀이 인터페이스
- **레벨 0-1**: 블록 코딩 UI (드래그 앤 드롭)
- **레벨 2-3**: 클로즈 (빈칸 채우기)
- **레벨 4-5**: 전문 코드 에디터 (Monaco Editor)

### ✅ 자동 채점 시스템
- 즉각적인 정답 검증
- 상세한 채점 결과 및 피드백
- 오류 분석 및 개선 방향 제시

### 📊 학습 통계 대시보드 (개발 예정)
- 강약점 시각화 (레이더 차트)
- 학습 진행도 추적
- 개인별 맞춤 학습 경로 추천

### 📝 풀이 기록 관리
- 모든 풀이 기록 저장 및 관리
- 과거 풀이 내역 조회
- 학습 패턴 분석

---

## 🛠 기술 스택

### Frontend
- **React** - 사용자 인터페이스 라이브러리
- **TypeScript** - 타입 안정성 및 개발 생산성
- **Vite** - 빠른 빌드 도구 및 개발 서버
- **Monaco Editor** - VS Code 기반의 코드 에디터 엔진

### Backend
- **Node.js** - JavaScript 런타임 환경
- **Express** - 웹 애플리케이션 프레임워크
- **MySQL 8.x** - 관계형 데이터베이스 관리 시스템
- **Redis** - 인메모리 캐시 및 세션 관리
- **OpenAI API** - AI 기반 문제 생성

### DevOps & Tools
- **Git/GitHub** - 버전 관리
- **ESLint/Prettier** - 코드 품질 및 스타일 관리
- **Conventional Commits** - 커밋 메시지 규칙

---

## 🏗 시스템 아키텍처

### Monorepo 구조

```
gpters/
├── frontend/                # React 클라이언트
│   ├── src/
│   │   ├── components/     # 재사용 가능한 컴포넌트
│   │   ├── pages/          # 페이지 컴포넌트
│   │   └── services/       # API 서비스
│   └── package.json
├── backend/                 # Node.js 서버
│   ├── controllers/        # 요청 처리 로직
│   ├── services/           # 비즈니스 로직
│   ├── routes/             # API 라우트
│   └── package.json
├── database_schema.sql      # MySQL 스키마
├── database_schema_erd.sql  # ERD용 참고 스키마
├── crud_queries.sql         # CRUD 예시 쿼리
├── redis_schema.md          # Redis 키 설계 문서
└── .env.example             # 환경변수 예시
```

### 데이터 플로우

```
사용자 → Frontend (React) ↔ Backend (Express) ↔ MySQL / Redis / OpenAI
```

### 주요 컴포넌트

- **Frontend**: 사용자 인터페이스 및 상호작용
- **API Server**: 비즈니스 로직 및 데이터 처리
- **Database**: 문제, 사용자, 제출 기록 저장
- **Cache Layer**: 성능 최적화 및 세션 관리
- **AI Service**: 지능형 문제 생성

---

## 🚀 시작하기

### 필수 요구사항

- Node.js 16.x 이상
- MySQL 8.x
- npm 또는 yarn
- Redis (선택사항, 권장)

### 환경 변수 설정

루트 디렉토리 또는 `backend/` 폴더에 `.env` 파일을 생성하고 다음 변수를 설정하세요:

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=gpters

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Redis (선택사항)
REDIS_HOST=localhost
REDIS_PORT=6379

# Server
PORT=5000
NODE_ENV=development
```

자세한 내용은 `.env.example` 파일을 참고하세요.

### 데이터베이스 설정

MySQL에 스키마를 적용합니다:

```bash
mysql -u your_db_user -p gpters < database_schema.sql
```

### 설치 및 실행

#### Backend 실행

```bash
cd backend
npm install
npm run dev
```

Backend 서버는 `http://localhost:5000`에서 실행됩니다.

#### Frontend 실행

```bash
cd frontend
npm install
npm run dev
```

Frontend는 `http://localhost:5173`에서 실행됩니다 (Vite 기본 포트).

---

## 📚 레벨별 학습 시스템

### 레벨 0-1: 블록 코딩 🧩

**대상**: 프로그래밍 입문자

**특징**:
- 드래그 앤 드롭 인터페이스
- 시각적 프로그래밍 블록 사용
- 텍스트 코드 없이 로직 학습

**학습 목표**: 프로그래밍 개념과 순서도 이해

**채점 방식**: 블록 구성요소 및 시퀀스 매칭

---

### 레벨 2-3: 클로즈 (빈칸 채우기) ✍️

**대상**: 기본 문법을 배운 학습자

**특징**:
- 부분적으로 완성된 코드 제공
- 핵심 키워드나 구문 채우기
- 코드 구조 이해 중점

**학습 목표**: 문법 이해 및 코드 읽기 능력

**채점 방식**: 정답 토큰 일치 검증 (대소문자/공백 처리)

---

### 레벨 4-5: 코드 에디터 💻

**대상**: 숙련된 프로그래머

**특징**:
- Monaco Editor 기반 전문 에디터
- 실제 개발 환경과 동일한 경험
- 문법 하이라이팅, 자동완성 지원

**학습 목표**: 완전한 알고리즘 구현 능력

**채점 방식**: 테스트케이스 기반 실행 및 판정

---

## ✅ 채점 시스템

### L0-1: 블록 코딩 채점

- ✓ 구성요소(블록) 매칭
- ✓ 블록 시퀀스 순서 검증
- ✓ 논리적 흐름 정확성 평가
- ✓ 즉각적인 시각적 피드백 제공

### L2-3: 클로즈 채점

- ✓ 정답 토큰 일치 검증
- ✓ 대소문자 구분 옵션 처리
- ✓ 공백 및 특수문자 정규화
- ✓ 동의어 및 다양한 표현 인정
- ✓ 부분 점수 부여 가능

### L4-5: 코드 실행 채점 (개발 진행 중)

**테스트케이스 기반 판정**:
- 여러 입력값에 대한 출력 검증
- 예상 결과와 실제 결과 비교

**안전한 샌드박스 환경**:
- 격리된 실행 환경에서 코드 실행
- 시스템 보안 보장

**제약 조건 검증**:
- 타임아웃 제한 (무한 루프 방지)
- 메모리 사용량 제한
- 금지된 함수/라이브러리 체크

**상세한 피드백**:
- 실패한 테스트케이스 정보
- 시간/공간 복잡도 분석
- 최적화 제안

---

## 🔌 API 문서

### 문제 생성

```http
POST /api/problems/generate
Content-Type: application/json
```

**요청 본문**:
```json
{
  "level": 3,
  "topic": "two-sum-variation"
}
```

**응답 예시**:
```json
{
  "id": "prob_123",
  "level": 3,
  "type": "cloze",
  "prompt": "빈칸에 들어갈 단어를 채우세요: ...",
  "answerSchema": { "blanks": 2 },
  "difficulty": "medium"
}
```

---

### 답안 채점

```http
POST /api/problems/grade
Content-Type: application/json
```

**기능**:
- 사용자 답안 제출
- 레벨별 채점 규칙 자동 적용
- 즉각적인 결과 및 피드백 반환

---

### 문제 조회

```http
GET /api/problems/:id
```

**기능**:
- 특정 문제의 상세 정보 조회
- 문제 내용, 난이도, 타입, 제약조건 반환

---

## 🗺️ 로드맵

### ✅ 완료된 기능

- [x] 기본 문제 생성 및 채점 시스템 구현
- [x] 레벨별 UI/UX 개발 완료
- [x] OpenAI API 통합 성공
- [x] MySQL 데이터베이스 스키마 설계
- [x] RESTful API 기본 구조 완성
- [x] 사용자 인증 및 세션 관리
- [x] 블록 코딩 인터페이스 (L0-1)
- [x] 클로즈 인터페이스 (L2-3)

### 🚀 현재 진행 중

- [ ] L4-5 코드 채점 시스템 고도화
  - 샌드박스 환경 구축
  - 테스트케이스 자동 생성
- [ ] 학습 통계 대시보드 개발
- [ ] L2-3 클로즈 생성·채점 규칙 정교화
- [ ] 문제 품질 개선 및 다양화

### 📋 향후 개발 계획

**단기 목표** (1-2개월)
- [ ] 강약점 시각화 (레이더 차트)
- [ ] 학습 경로 추천 알고리즘
- [ ] 문제 난이도 자동 조정

**중기 목표** (3-6개월)
- [ ] Docker 컨테이너화
- [ ] 배포 파이프라인 구축
- [ ] CI/CD 자동화
- [ ] 성능 최적화 및 스케일링

**장기 목표** (6개월 이상)
- [ ] 다국어 지원
- [ ] 협업 학습 기능
- [ ] 모바일 앱 개발
- [ ] AI 튜터링 시스템

---

## 🤝 기여하기

기여는 언제나 환영합니다! 다음 단계를 따라주세요:

1. 프로젝트를 Fork합니다
2. Feature 브랜치를 생성합니다 (`git checkout -b feat/amazing-feature`)
3. 변경사항을 커밋합니다 (`git commit -m 'feat: Add amazing feature'`)
4. 브랜치에 Push합니다 (`git push origin feat/amazing-feature`)
5. Pull Request를 생성합니다

### 커밋 컨벤션

Conventional Commits를 따릅니다:

- `feat:` - 새로운 기능 추가
- `fix:` - 버그 수정
- `docs:` - 문서 수정
- `style:` - 코드 포맷팅, 세미콜론 누락 등
- `refactor:` - 코드 리팩토링
- `test:` - 테스트 코드 추가
- `chore:` - 빌드 업무, 패키지 매니저 설정 등

---

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

---

## 👥 팀

gpters는 졸업작품 프로젝트로 개발되었습니다.

---

## 📞 문의

프로젝트에 대한 질문이나 제안사항이 있으시면 [이슈](../../issues)를 생성해주세요.

---

<div align="center">

**gpters - 모두를 위한 알고리즘 학습 플랫폼**

블록 코딩 → 클로즈 → 코드 에디터 단계별 성장

Made with ❤️ by gpters Team

</div>
