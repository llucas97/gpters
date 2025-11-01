# gpters

알고리즘 문제 **생성 · 풀이 · 채점** 플랫폼 (졸업작품).  
레벨 규칙:
- **0–1:** 블록 코딩 UI
- **2–3:** 클로즈(빈칸 채우기)
- **4–5:** 코드 에디터(모나코 기반) — 채점 로직 고도화 예정

## ✨ Features
- 문제 자동 생성 (레벨별 규칙 반영)
- 풀이 인터페이스: 블록(0–1) / 클로즈(2–3) / 코드(4–5)
- 채점(진행중): 레벨별 채점 기준 설계
- 학습 통계(계획): 강약점 시각화(레이더 차트)

## 📦 Monorepo Structure
```
.
├── backend/                 # Node.js + Express + MySQL
├── frontend/                # React + TypeScript + Vite (+ Monaco)
├── .env.example             # 환경변수 예시
├── database_schema.sql      # MySQL 스키마
├── database_schema_erd.sql  # ERD용/참고 스키마
├── crud_queries.sql         # CRUD 예시/유틸 쿼리
├── redis_schema.md          # Redis 키 설계 메모
└── package.json
```




## 🛠 Tech Stack
**Backend**
- Node.js, Express
- MySQL (스키마: `database_schema.sql`)
- OpenAI API — 문제 생성 파트에 활용 

**Frontend**
- React + TypeScript + Vite
- Monaco Editor (레벨 4–5 코드 편집기 UI)

> 언어 비율: JavaScript/TypeScript 중심 

## ⚙️ Prerequisites
- Node.js 
- MySQL 8.x
- npm 

## 🔐 Environment Variables
`.env`(루트 또는 `backend/`)을 생성하세요. `./.env.example`를 참고하세요.


## 🗄️ Database Setup (MySQL)
MySQL에 스키마 적용:
```
mysql -u <USER> -p <DATABASE> < database_schema.sql
```
작업/예시 쿼리는 crud_queries.sql 참고.

## 🚀 Run (Development)
실제 스크립트명은 각 package.json 확인 후 조정하세요.

Backend
```
cd backend
npm install            # 워크스페이스가 아니면 별도 설치
npm run dev
```
Frontend
```
cd frontend
npm install
npm run dev            # Vite dev server
```

## 🧭 Project Conventions
브랜치: main / feat/* / fix/*

커밋: Conventional Commits 권장 (feat:, fix:, chore:, docs: …)

코드 스타일: ESLint/Prettier

## 🔌 API 

```
POST /api/problems/generate : 레벨/주제 입력 → 문제 생성

POST /api/problems/grade : 제출 답안 채점 (레벨별 규칙)

GET /api/problems/:id : 문제 상세
```
요청/응답 예시:

```
POST /api/problems/generate
Content-Type: application/json
```
```
{
  "level": 3,
  "topic": "two-sum-variation"
}
```
```
// 200 OK
{
  "id": "prob_123",
  "level": 3,
  "type": "cloze",
  "prompt": "빈칸에 들어갈 단어를 채우세요: ...",
  "answerSchema": { "blanks": 2 }
}
```
## 🧪 Grading Rules
L0–1 (블록): 구성요소 매칭/정답 블록 시퀀스 비교

L2–3 (클로즈): 정답 토큰 일치(대소문/공백/동의어 처리 옵션)

L4–5 (코드): 테스트케이스 기반 실행/판정(샌드박스, 타임아웃, 출력 비교) (설계/구현 진행 예정)

## 🗺️ Roadmap
 README 확정(실행 스크립트·버전 명시)

 L2–3 클로즈 생성·채점 규칙 정교화

 L4–5 코드 채점기(테스트케이스, 샌드박스) 설계/구현

 사용자 통계 대시보드(레이더 차트)

 배포 파이프라인(Docker/CI)



## 📄 License
MIT

