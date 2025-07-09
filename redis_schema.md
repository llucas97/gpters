# 📊 Gpters Redis 설계 및 캐싱 전략

## 🎯 **Redis 사용 목적**

1. **세션 관리** - 사용자 로그인 세션 저장
2. **캐싱** - 자주 조회되는 데이터 캐싱
3. **실시간 데이터** - 리그전 실시간 랭킹
4. **일시적 데이터** - 문제 제출 중간 결과

## 🗂️ **Redis 키 네이밍 규칙**

```
gpters:{domain}:{id}:{sub_key}
```

### **예시:**
- `gpters:session:user:123` - 사용자 123의 세션
- `gpters:cache:problems:level:0` - 레벨 0 문제 목록 캐시
- `gpters:league:live:2024-07-W1` - 2024년 7월 1주차 리그 실시간 데이터

## 🔐 **1. 세션 관리**

### **세션 키 구조**
```redis
# 사용자 세션 정보
gpters:session:user:{user_id}
{
  "user_id": 123,
  "username": "user123",
  "email": "user@example.com",
  "current_level": 2,
  "experience_points": 150,
  "last_activity": "2024-07-09T13:23:30Z",
  "login_time": "2024-07-09T10:00:00Z",
  "ip_address": "192.168.1.100"
}
TTL: 7200 (2시간)
```

### **JWT 토큰 블랙리스트**
```redis
# 로그아웃된 토큰 관리
gpters:blacklist:jwt:{token_jti}
value: "revoked"
TTL: {token_exp_time}
```

## 🚀 **2. 성능 캐싱**

### **문제 목록 캐싱**
```redis
# 레벨별 문제 목록
gpters:cache:problems:level:{level}
[
  {
    "problem_id": 1,
    "title": "변수와 출력",
    "difficulty": "easy",
    "rating": 4.5,
    "category": "variables"
  }
]
TTL: 3600 (1시간)

# 문제 상세 정보
gpters:cache:problem:{problem_id}
{
  "problem_id": 1,
  "title": "변수와 출력",
  "description": "변수를 사용해서...",
  "test_cases": [...],
  "hints": [...]
}
TTL: 1800 (30분)
```

### **사용자 통계 캐싱**
```redis
# 사용자 학습 통계
gpters:cache:user:stats:{user_id}
{
  "total_submissions": 45,
  "correct_submissions": 38,
  "accuracy_rate": 84.44,
  "current_streak": 5,
  "total_time_spent": 3600
}
TTL: 900 (15분)
```

## 🏆 **3. 리그전 실시간 데이터**

### **실시간 랭킹**
```redis
# 리그 참여자 점수 (Sorted Set)
gpters:league:ranking:{league_id}
ZADD gpters:league:ranking:2024-07-W1 1250 "user:123"
ZADD gpters:league:ranking:2024-07-W1 1100 "user:456"
ZADD gpters:league:ranking:2024-07-W1 950 "user:789"
TTL: 604800 (7일)

# 리그 메타데이터
gpters:league:meta:{league_id}
{
  "league_id": "2024-07-W1",
  "name": "7월 1주차 챌린지",
  "start_date": "2024-07-01",
  "end_date": "2024-07-07",
  "participant_count": 156,
  "status": "active"
}
TTL: 604800 (7일)
```

### **실시간 활동 피드**
```redis
# 리그 활동 스트림
gpters:league:activity:{league_id}
[
  {
    "user_id": 123,
    "username": "coder123",
    "action": "solved_problem",
    "problem_id": 45,
    "score": 95,
    "timestamp": "2024-07-09T13:20:00Z"
  }
]
TTL: 86400 (24시간)
```

## ⚡ **4. 임시 데이터 및 제출 처리**

### **문제 제출 중간 결과**
```redis
# 코드 실행 결과 임시 저장
gpters:temp:submission:{submission_uuid}
{
  "user_id": 123,
  "problem_id": 45,
  "user_code": "def solution():\n    return 'Hello'",
  "status": "running",
  "test_results": [
    {"case": 1, "status": "passed"},
    {"case": 2, "status": "running"}
  ]
}
TTL: 300 (5분)
```

### **레이트 리미팅**
```redis
# API 호출 제한
gpters:rate_limit:user:{user_id}:{endpoint}
value: 5 (호출 횟수)
TTL: 60 (1분)

# 문제 제출 제한 (스팸 방지)
gpters:submission_limit:user:{user_id}
value: 3
TTL: 60 (1분)
```

## 📊 **5. 출석 및 일일 통계**

### **일일 출석 캐시**
```redis
# 오늘 출석한 사용자 목록 (Set)
gpters:attendance:daily:{date}
SADD gpters:attendance:daily:2024-07-09 "user:123"
SADD gpters:attendance:daily:2024-07-09 "user:456"
TTL: 86400 (24시간)

# 사용자별 연속 출석일
gpters:streak:user:{user_id}
value: 7 (연속 7일)
TTL: 86400 (24시간)
```

### **일일 문제 해결 카운터**
```redis
# 사용자별 오늘 해결한 문제 수
gpters:daily:solved:{user_id}:{date}
value: 3
TTL: 86400 (24시간)
```

## 🔄 **6. 캐시 무효화 전략**

### **캐시 무효화 패턴**
```javascript
// 1. 사용자 정보 업데이트 시
await redis.del(`gpters:cache:user:stats:${userId}`);
await redis.del(`gpters:session:user:${userId}`);

// 2. 문제 정보 수정 시
await redis.del(`gpters:cache:problem:${problemId}`);
await redis.del(`gpters:cache:problems:level:${level}`);

// 3. 리그 점수 업데이트 시
await redis.zadd(`gpters:league:ranking:${leagueId}`, score, `user:${userId}`);
```

## ⚙️ **7. Redis 설정 권장사항**

### **redis.conf 주요 설정**
```conf
# 메모리 정책
maxmemory 2gb
maxmemory-policy allkeys-lru

# 영속성 설정 (개발환경)
save 900 1
save 300 10
save 60 10000

# 보안
requirepass your_redis_password
bind 127.0.0.1
port 6379

# 성능 최적화
tcp-keepalive 300
timeout 0
```

### **Node.js Redis 클라이언트 설정**
```javascript
const redis = require('redis');

const client = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
  db: 0, // 기본 DB
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  maxRetriesPerRequest: null,
});

// 세션용 별도 DB
const sessionClient = redis.createClient({
  ...client.options,
  db: 1, // 세션 전용 DB
});

// 캐시용 별도 DB  
const cacheClient = redis.createClient({
  ...client.options,
  db: 2, // 캐시 전용 DB
});
```

## 📈 **8. 모니터링 및 관리**

### **Redis 모니터링 쿼리**
```redis
# 메모리 사용량 확인
INFO memory

# 연결된 클라이언트 수
INFO clients

# 키 통계
INFO keyspace

# 성능 통계
INFO stats
```

### **정기 정리 작업**
```javascript
// 매일 자정 실행
async function cleanupExpiredData() {
  // 오래된 임시 데이터 정리
  const tempKeys = await redis.keys('gpters:temp:*');
  if (tempKeys.length > 0) {
    await redis.del(...tempKeys);
  }
  
  // 완료된 리그 데이터 정리 (7일 후)
  const expiredLeagues = await redis.keys('gpters:league:*');
  // 검증 후 삭제 로직
}
```

## 🛡️ **9. 보안 고려사항**

1. **민감 정보 제외**: 비밀번호, 결제 정보는 Redis 저장 금지
2. **TTL 설정**: 모든 키에 적절한 만료 시간 설정
3. **접근 제한**: Redis AUTH 및 네트워크 접근 제한
4. **암호화**: 필요 시 데이터 암호화 후 저장

## 🎯 **10. 성능 최적화 팁**

1. **배치 처리**: PIPELINE 사용으로 네트워크 RTT 감소
2. **적절한 데이터 구조**: String, Hash, Set, Sorted Set 적절히 활용
3. **메모리 효율성**: 큰 키 피하기, 적절한 압축
4. **연결 풀링**: 커넥션 풀 관리로 성능 향상

---

이 Redis 설계는 Gpters 플랫폼의 실시간성, 성능, 확장성을 모두 고려하여 설계되었습니다. 특히 게이미피케이션 요소인 리그전과 출석체크에서 Redis의 강점을 최대한 활용할 수 있습니다. 