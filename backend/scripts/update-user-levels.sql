-- =====================================================
-- 사용자 레벨 수정 쿼리
-- =====================================================

-- 1. 사용자 22의 현재 레벨 확인
SELECT 
    user_id, 
    username, 
    email, 
    current_level, 
    experience_points, 
    updated_at
FROM users 
WHERE user_id = 22;

-- 2. 사용자 22의 경험치 레벨 확인 (user_experience 테이블)
SELECT 
    user_id,
    totalExperience,
    level AS experience_level,
    currentLevelExp,
    expToNextLevel,
    progressPercentage,
    updatedAt
FROM user_experience
WHERE user_id = 22;

-- =====================================================
-- users 테이블 레벨 수정 (레벨 테스트 결과: 0-5)
-- =====================================================

-- 사용자 22의 레벨을 2로 변경
UPDATE users 
SET current_level = 2, 
    updated_at = CURRENT_TIMESTAMP
WHERE user_id = 22;

-- 다른 사용자들의 레벨 확인
SELECT user_id, username, current_level, experience_points
FROM users
ORDER BY user_id;

-- =====================================================
-- user_experience 테이블 레벨 수정 (경험치 레벨: 1부터)
-- =====================================================

-- 사용자 22의 경험치 레벨을 2로 변경
UPDATE user_experience
SET level = 2,
    currentLevelExp = 0,
    expToNextLevel = 200,
    progressPercentage = 0,
    updatedAt = CURRENT_TIMESTAMP
WHERE user_id = 22;

-- 사용자 22의 경험치 레벨을 1로 리셋 (초기 레벨)
UPDATE user_experience
SET level = 1,
    totalExperience = 0,
    currentLevelExp = 0,
    expToNextLevel = 100,
    progressPercentage = 0,
    highestLevel = 1,
    totalLevelUps = 0,
    updatedAt = CURRENT_TIMESTAMP
WHERE user_id = 22;

-- =====================================================
-- 사용자 22의 전체 정보 확인
-- =====================================================

-- users 테이블 정보
SELECT * FROM users WHERE user_id = 22;

-- user_experience 테이블 정보  
SELECT * FROM user_experience WHERE user_id = 22;

-- 레벨 테스트 결과
SELECT * FROM level_test_results WHERE user_id = 22 ORDER BY completed_at DESC LIMIT 5;

-- =====================================================
-- 일괄 레벨 수정 예시
-- =====================================================

-- 모든 사용자의 레벨을 0으로 리셋 (주의!)
-- UPDATE users SET current_level = 0;

-- 특정 레벨 이상 사용자들의 레벨 수정
-- UPDATE users 
-- SET current_level = 1
-- WHERE current_level >= 2;

-- =====================================================
-- 경험치 시스템 레벨별 최대 경험치 참고
-- =====================================================
-- 레벨 1: 100 (누적 100)
-- 레벨 2: 200 (누적 300 = 100 + 200)
-- 레벨 3: 400 (누적 700 = 100 + 200 + 400)
-- 레벨 4: 800 (누적 1500 = 100 + 200 + 400 + 800)
-- 레벨 5: 1600 (누적 3100)
-- 레벨 6: 3200 (누적 6300)

-- 특정 레벨에 맞는 경험치 설정
-- UPDATE user_experience
-- SET level = 3,
--     totalExperience = 700,
--     currentLevelExp = 0,
--     expToNextLevel = 800,
--     progressPercentage = 0
-- WHERE user_id = 22;

