-- user_id 22번의 레벨 데이터 확인

-- users 테이블 확인
SELECT 
    user_id,
    username,
    current_level AS users_current_level,
    experience_points AS users_exp_points
FROM users
WHERE user_id = 22;

-- user_experience 테이블 확인
SELECT 
    user_id,
    level AS exp_system_level,
    totalExperience AS exp_system_exp,
    currentLevelExp,
    expToNextLevel,
    progressPercentage
FROM user_experience
WHERE user_id = 22;

-- 두 테이블 조인해서 비교
SELECT 
    u.user_id,
    u.username,
    u.current_level AS users_level,
    u.experience_points AS users_exp,
    ue.level AS exp_system_level,
    ue.totalExperience AS exp_system_exp,
    (ue.level - 1) AS calculated_users_level,
    CASE 
        WHEN u.current_level = (ue.level - 1) THEN '✅ 동기화됨'
        ELSE '❌ 동기화 안됨'
    END AS sync_status
FROM users u
LEFT JOIN user_experience ue ON u.user_id = ue.user_id
WHERE u.user_id = 22;

