-- user_id 22번의 레벨을 2로 업데이트
UPDATE users 
SET current_level = 2, 
    updated_at = CURRENT_TIMESTAMP
WHERE user_id = 22;

-- 업데이트 확인
SELECT user_id, username, current_level, experience_points, updated_at
FROM users
WHERE user_id = 22;

