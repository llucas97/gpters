-- users 테이블의 current_level과 user_experience 테이블의 level 동기화
-- user_experience.level (1부터 시작)을 users.current_level (0~5)로 변환
-- user_experience 테이블의 level을 기준으로 users 테이블 업데이트

UPDATE users u
INNER JOIN user_experience ue ON u.user_id = ue.user_id
SET 
    u.current_level = GREATEST(0, LEAST(5, ue.level - 1)),
    u.experience_points = ue.totalExperience,
    u.updated_at = CURRENT_TIMESTAMP;

-- 동기화 결과 확인
SELECT 
    u.user_id,
    u.username,
    u.current_level AS users_current_level,
    u.experience_points AS users_exp_points,
    ue.level AS exp_system_level,
    ue.totalExperience AS exp_system_exp,
    (ue.level - 1) AS calculated_users_level,
    CASE 
        WHEN u.current_level = GREATEST(0, LEAST(5, ue.level - 1)) THEN '✅ 동기화됨'
        ELSE '❌ 동기화 안됨'
    END AS sync_status
FROM users u
INNER JOIN user_experience ue ON u.user_id = ue.user_id
ORDER BY u.user_id;

