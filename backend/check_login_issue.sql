-- =====================================================
-- 로그인 문제 진단 SQL 쿼리
-- =====================================================

-- 1. users 테이블 구조 확인
DESCRIBE users;

-- 2. 현재 등록된 사용자 확인
SELECT 
    user_id,
    email,
    username,
    provider,
    current_level,
    is_active,
    password_hash IS NOT NULL as has_password,
    LENGTH(password_hash) as password_length,
    created_at
FROM users
ORDER BY user_id;

-- 3. 비밀번호가 없는 사용자 확인
SELECT user_id, email, username, provider
FROM users
WHERE password_hash IS NULL OR password_hash = '';

-- 4. is_active가 false인 사용자 확인
SELECT user_id, email, username, is_active
FROM users
WHERE is_active = FALSE;

-- 5. 레벨이 -1인 사용자 (레벨테스트 미완료)
SELECT user_id, email, username, current_level, survey_completed
FROM users
WHERE current_level = -1;

-- =====================================================
-- 문제 해결 쿼리
-- =====================================================

-- 모든 유저 레벨 0으로 변경
SET SQL_SAFE_UPDATES = 0;

UPDATE users 
SET current_level = 0, 
    experience_points = 0
WHERE user_id > 0;

SET SQL_SAFE_UPDATES = 1;

-- 모든 유저 활성화
SET SQL_SAFE_UPDATES = 0;

UPDATE users 
SET is_active = TRUE
WHERE user_id > 0;

SET SQL_SAFE_UPDATES = 1;

-- 확인
SELECT user_id, email, username, current_level, experience_points, is_active
FROM users;

