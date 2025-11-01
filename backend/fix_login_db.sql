-- =====================================================
-- 로그인 문제 해결 SQL 스크립트
-- =====================================================

-- 1단계: 현재 users 테이블 구조 확인
DESCRIBE users;

-- 2단계: 문제 진단
-- 비밀번호가 없는 사용자
SELECT user_id, email, username, provider,
       password_hash IS NULL as no_password,
       LENGTH(password_hash) as pwd_length
FROM users
WHERE password_hash IS NULL OR password_hash = '';

-- 비활성화된 사용자
SELECT user_id, email, username, is_active
FROM users
WHERE is_active = FALSE OR is_active IS NULL;

-- provider 문제
SELECT user_id, email, username, provider
FROM users
WHERE provider IS NULL OR provider NOT IN ('local', 'google', 'kakao', 'github');

-- 3단계: 문제 해결
SET SQL_SAFE_UPDATES = 0;

-- ✅ 모든 유저 레벨 0으로 초기화
UPDATE users 
SET current_level = 0, 
    experience_points = 0
WHERE user_id > 0;

-- ✅ 모든 유저 활성화
UPDATE users 
SET is_active = TRUE
WHERE user_id > 0;

-- ✅ NULL provider를 'local'로 설정
UPDATE users 
SET provider = 'local'
WHERE provider IS NULL;

-- ✅ password_hash가 있지만 provider가 소셜인 경우 수정
UPDATE users 
SET provider = 'local'
WHERE password_hash IS NOT NULL 
  AND password_hash != ''
  AND provider != 'local';

SET SQL_SAFE_UPDATES = 1;

-- 4단계: 검증
SELECT 
    user_id,
    email,
    username,
    provider,
    current_level,
    experience_points,
    is_active,
    password_hash IS NOT NULL as has_password,
    LENGTH(password_hash) as pwd_length,
    created_at
FROM users
ORDER BY user_id;

-- 5단계: 로그인 가능한 사용자만 필터링
SELECT 
    user_id,
    email,
    username,
    'LOGIN OK' as status
FROM users
WHERE is_active = TRUE
  AND password_hash IS NOT NULL
  AND password_hash != ''
  AND provider = 'local';

-- =====================================================
-- 테스트 계정 생성 (필요시)
-- =====================================================
-- 비밀번호: password123
-- INSERT INTO users (
--     email, 
--     username, 
--     full_name, 
--     password_hash, 
--     provider, 
--     current_level, 
--     experience_points, 
--     survey_completed, 
--     is_active, 
--     email_verified,
--     created_at,
--     updated_at
-- ) VALUES (
--     'test@test.com',
--     'testuser',
--     'Test User',
--     '$2a$10$N9qo8uLOickgx2ZMRZoMye/IVI9VVujC6KkeVmR4rC.WvqY8GwqLu',
--     'local',
--     0,
--     0,
--     false,
--     true,
--     false,
--     NOW(),
--     NOW()
-- );

