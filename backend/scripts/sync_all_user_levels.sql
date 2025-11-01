-- 모든 유저의 레벨 동기화
-- user_experience 테이블의 level을 기준으로 users 테이블의 current_level 업데이트

-- 1. 동기화 전 현재 상태 확인
SELECT 
    u.user_id,
    u.username,
    u.current_level AS users_current_level,
    u.experience_points AS users_exp,
    ue.level AS exp_system_level,
    ue.totalExperience AS exp_system_exp,
    (ue.level - 1) AS should_be_users_level,
    CASE 
        WHEN u.current_level = GREATEST(0, LEAST(5, ue.level - 1)) THEN '✅ 동기화됨'
        ELSE '❌ 동기화 필요'
    END AS sync_status
FROM users u
INNER JOIN user_experience ue ON u.user_id = ue.user_id
ORDER BY u.user_id;

-- 2. users 테이블 업데이트 (user_experience.level 기준)
UPDATE users u
INNER JOIN user_experience ue ON u.user_id = ue.user_id
SET 
    u.current_level = GREATEST(0, LEAST(5, ue.level - 1)),
    u.experience_points = ue.totalExperience,
    u.updated_at = CURRENT_TIMESTAMP;

-- 3. 동기화 후 결과 확인
SELECT 
    u.user_id,
    u.username,
    u.current_level AS users_current_level,
    u.experience_points AS users_exp_points,
    ue.level AS exp_system_level,
    ue.totalExperience AS exp_system_exp,
    (ue.level - 1) AS calculated_level,
    CASE 
        WHEN u.current_level = GREATEST(0, LEAST(5, ue.level - 1)) THEN '✅ 동기화됨'
        ELSE '❌ 여전히 동기화 안됨'
    END AS sync_status
FROM users u
INNER JOIN user_experience ue ON u.user_id = ue.user_id
ORDER BY u.user_id;

