# OpenAI 기반 문제 생성 엔진 설정 가이드

이 문서는 OpenAI API를 사용한 자동 문제 생성 기능을 설정하는 방법을 안내합니다.

## 📋 목차

1. [OpenAI API 키 발급](#1-openai-api-키-발급)
2. [환경 변수 설정](#2-환경-변수-설정)
3. [의존성 패키지 확인](#3-의존성-패키지-확인)
4. [테스트 실행](#4-테스트-실행)
5. [문제 생성 API 사용법](#5-문제-생성-api-사용법)
6. [문제해결](#6-문제해결)

---

## 1. OpenAI API 키 발급

### 1.1 OpenAI 계정 생성

1. [OpenAI 공식 웹사이트](https://platform.openai.com/)에 접속
2. 계정이 없다면 회원가입 진행
3. 로그인 후 [API Keys 페이지](https://platform.openai.com/api-keys)로 이동

### 1.2 API 키 생성

1. **"Create new secret key"** 버튼 클릭
2. 키 이름 입력 (예: `gpters-problem-generation`)
3. 생성된 API 키를 **안전한 곳에 복사** (재확인 불가)
4. 형식: `sk-proj-...` 또는 `sk-...`

### 1.3 결제 수단 등록

OpenAI API는 종량제로 과금됩니다:

1. [Billing 페이지](https://platform.openai.com/account/billing)로 이동
2. 결제 수단 등록 (신용카드/데빗카드)
3. 월 사용 한도 설정 (권장: $5-$10)

**예상 비용:**
- GPT-4o-mini 모델 사용 시:
  - 입력: $0.15 per 1M tokens
  - 출력: $0.60 per 1M tokens
- 문제 1개 생성: 약 $0.001-0.005 (0.1-0.5원)

---

## 2. 환경 변수 설정

### 2.1 .env 파일 생성

프로젝트 루트 디렉토리에 `.env` 파일을 생성합니다:

```bash
# 프로젝트 루트 디렉토리에서
touch .env
```

### 2.2 필수 환경 변수 설정

`.env` 파일에 다음 내용을 추가:

```bash
# OpenAI API 설정 (필수)
OPENAI_API_KEY=sk-proj-your-actual-api-key-here
OPENAI_MODEL=gpt-4o-mini

# 데이터베이스 설정 (필수)
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_database_password
DB_NAME=your_database_name
DB_PORT=3306

# JWT 인증 (필수)
JWT_SECRET=your_jwt_secret_key

# 서버 설정
PORT=3001
NODE_ENV=development
SESSION_SECRET=your_session_secret

# 문제 생성 설정 (선택)
PROBLEM_LOCALE=ko
MAX_PROBLEM_GENERATION_RETRIES=3
ENABLE_PROBLEM_VALIDATION=true

# 관리자 키 (디버그용, 선택)
ADMIN_KEY=your_admin_key_for_debugging
```

⚠️ **보안 주의사항:**
- `.env` 파일을 절대 Git에 커밋하지 마세요
- `.gitignore`에 `.env`가 포함되어 있는지 확인하세요

---

## 3. 의존성 패키지 확인

### 3.1 필수 패키지 설치 확인

```bash
cd backend
npm install
```

필요한 패키지들:
- `dotenv`: 환경 변수 로드
- `json5`: JSON 파싱 (강건)
- `express`: 웹 서버
- `mysql2`, `sequelize`: 데이터베이스

### 3.2 설치 확인

```bash
npm list dotenv json5
```

---

## 4. 테스트 실행

### 4.1 기본 연결 테스트

서버가 정상적으로 시작되는지 확인:

```bash
cd backend
npm run dev
```

브라우저에서 http://localhost:3001/api/test 접속하여 DB 연결 확인

### 4.2 OpenAI 문제 생성 통합 테스트

**⚠️ 주의:** 실제 API 호출이 발생하므로 약간의 비용이 발생합니다 (~$0.05-0.10)

```bash
cd backend
node test_problem_generation.js
```

**예상 출력:**
```
✅ OPENAI_API_KEY 확인됨

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 Cloze 문제 (빈칸 채우기) 생성 테스트
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[레벨 0] 문제 생성 중...
   제목: 변수 선언과 출력
   블랭크 개수: 2

✅ 성공: 레벨 0 Cloze 문제 생성
   상세: 블랭크: 2개
...

📊 테스트 결과 요약
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

총 테스트: 8개
✅ 성공: 8개
❌ 실패: 0개
성공률: 100.0%
```

### 4.3 간단한 API 테스트

Postman이나 curl로 API 직접 테스트:

```bash
# 레벨 0 블록 코딩 문제 생성
curl -X POST http://localhost:3001/api/block-coding/generate \
  -H "Content-Type: application/json" \
  -d '{
    "level": 0,
    "topic": "basic",
    "language": "javascript"
  }'

# 레벨 2 Cloze 문제 생성
curl -X POST http://localhost:3001/api/problem-bank/generate \
  -H "Content-Type: application/json" \
  -d '{
    "level": 2,
    "topic": "array",
    "language": "javascript"
  }'
```

---

## 5. 문제 생성 API 사용법

### 5.1 지원되는 문제 유형

| 레벨 | 문제 유형 | 엔드포인트 | 설명 |
|------|----------|-----------|------|
| 0-1 | 블록 코딩 | `/api/block-coding/generate` | 드래그 앤 드롭 블록 |
| 0-3 | Cloze (빈칸) | `/api/problem-bank/generate` | 빈칸 채우기 |
| 4 | 코드 순서 맞추기 | `/api/code-ordering/generate` | 라인 정렬 |
| 5 | 버그 수정 | `/api/bug-fix/generate` | 디버깅 |

### 5.2 API 요청 예시

#### 블록 코딩 문제 생성

```javascript
// POST /api/block-coding/generate
{
  "level": 0,        // 0 또는 1
  "topic": "basic",  // 주제: basic, loop, condition 등
  "language": "javascript"  // javascript, python, java, cpp, c
}
```

**응답:**
```javascript
{
  "success": true,
  "data": {
    "title": "변수 선언과 출력",
    "description": "...",
    "blankedCode": "let x = 10;\nBLANK_1.BLANK_2(x);",
    "blocks": [
      { "id": "answer_1", "text": "console", "type": "answer", "blankId": 1 },
      { "id": "answer_2", "text": "log", "type": "answer", "blankId": 2 },
      { "id": "distractor_1", "text": "print", "type": "distractor" }
    ]
  }
}
```

#### Cloze 문제 생성

```javascript
// POST /api/problem-bank/generate
{
  "level": 2,        // 0-30
  "topic": "array",
  "language": "javascript"
}
```

#### 코드 순서 맞추기 생성

```javascript
// POST /api/code-ordering/generate
{
  "level": 4,
  "topic": "algorithm",
  "language": "javascript"
}
```

#### 버그 수정 문제 생성

```javascript
// POST /api/bug-fix/generate
{
  "level": 5,
  "topic": "algorithm",
  "language": "javascript"
}
```

### 5.3 검증 API

각 문제 유형마다 사용자 답안 검증 API가 있습니다:

```javascript
// POST /api/block-coding/validate
{
  "problem": { /* 생성된 문제 객체 */ },
  "userAnswers": ["console", "log"]
}

// POST /api/code-ordering/validate
{
  "problem": { /* 생성된 문제 객체 */ },
  "userOrderedLines": ["line1", "line2", "line3"]
}

// POST /api/bug-fix/validate
{
  "problem": { /* 생성된 문제 객체 */ },
  "userCode": "fixed code here"
}
```

---

## 6. 문제해결

### 문제 1: "OPENAI_API_KEY missing" 오류

**원인:** API 키가 환경 변수에 설정되지 않음

**해결:**
1. `.env` 파일이 프로젝트 루트에 있는지 확인
2. `OPENAI_API_KEY=sk-proj-...` 형식이 맞는지 확인
3. 서버 재시작: `npm run dev`

### 문제 2: "OpenAI 401" 또는 "Invalid API Key" 오류

**원인:** API 키가 유효하지 않음

**해결:**
1. [OpenAI API Keys 페이지](https://platform.openai.com/api-keys)에서 키 확인
2. 키가 만료되었거나 삭제되었다면 새로 생성
3. `.env` 파일에 새 키 업데이트

### 문제 3: "OpenAI 429" 또는 Rate Limit 오류

**원인:** API 호출 제한 초과

**해결:**
1. 잠시 대기 후 재시도 (1-2분)
2. 테스트 시 `setTimeout`으로 딜레이 추가
3. [Usage 페이지](https://platform.openai.com/usage)에서 사용량 확인

### 문제 4: "Insufficient funds" 또는 결제 오류

**원인:** OpenAI 계정에 크레딧 부족

**해결:**
1. [Billing 페이지](https://platform.openai.com/account/billing)에서 잔액 확인
2. 결제 수단 추가 또는 크레딧 충전
3. 월 사용 한도 설정 검토

### 문제 5: 생성된 문제 검증 실패

**원인:** 문제가 품질 기준을 충족하지 못함

**해결:**
1. 로그에서 구체적인 검증 오류 확인
2. 필요시 재생성 (온도 파라미터나 프롬프트 조정)
3. `backend/services/problemValidator.js`에서 검증 기준 확인

### 문제 6: 한국어가 제대로 생성되지 않음

**원인:** PROBLEM_LOCALE 설정 누락

**해결:**
`.env` 파일에 추가:
```bash
PROBLEM_LOCALE=ko
```

---

## 📚 추가 자료

- [OpenAI API 문서](https://platform.openai.com/docs)
- [GPT-4 모델 가이드](https://platform.openai.com/docs/models/gpt-4)
- [프로젝트 GitHub 이슈](https://github.com/your-repo/issues)

---

## 🆘 지원

문제가 해결되지 않거나 추가 질문이 있다면:

1. GitHub Issues에 문제 등록
2. 로그 파일 첨부 (`backend/logs/` 디렉토리)
3. 환경 정보 포함 (OS, Node 버전 등)

---

**마지막 업데이트:** 2025-01-15

