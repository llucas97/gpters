-- users 테이블의 current_level을 user_experience 테이블의 level과 동일하게 설정
-- 변환 없이 그대로 동일하게 설정 (단, users.current_level은 0~5 범위이므로 제한 적용)

-- 1. 동기화 전 현재 상태 확인
SELECT 
    u.user_id,
    u.username,
    u.current_level AS users_current_level,
    ue.level AS exp_system_level,
    CASE 
        WHEN u.current_level = LEAST(5, ue.level) THEN '✅ 동일함'
        ELSE '❌ 다름'
    END AS status
FROM users u
INNER JOIN user_experience ue ON u.user_id = ue.user_id
ORDER BY u.user_id;

-- 2. users.current_level을 user_experience.level과 동일하게 업데이트
-- user_experience.level이 5를 초과하면 5로 제한
UPDATE users u
INNER JOIN user_experience ue ON u.user_id = ue.user_id
SET 
    u.current_level = LEAST(5, ue.level),
    u.experience_points = ue.totalExperience,
    u.updated_at = CURRENT_TIMESTAMP;

-- 3. 동기화 후 결과 확인
SELECT 
    u.user_id,
    u.username,
    u.current_level AS users_current_level,
    ue.level AS exp_system_level,
    u.experience_points AS users_exp_points,
    ue.totalExperience AS exp_system_exp,
    CASE 
        WHEN u.current_level = LEAST(5, ue.level) THEN '✅ 동일함'
        ELSE '❌ 여전히 다름'
    END AS status
FROM users u
INNER JOIN user_experience ue ON u.user_id = ue.user_id
ORDER BY u.user_id;

