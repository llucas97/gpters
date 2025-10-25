-- 사용자 경험치 및 레벨 관리 테이블 생성
-- 경험치 시스템을 위한 데이터베이스 스키마

CREATE TABLE IF NOT EXISTS user_experience (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    total_experience INT NOT NULL DEFAULT 0 COMMENT '총 경험치',
    level INT NOT NULL DEFAULT 1 COMMENT '현재 레벨',
    current_level_exp INT NOT NULL DEFAULT 0 COMMENT '현재 레벨에서의 경험치',
    exp_to_next_level INT NOT NULL DEFAULT 100 COMMENT '다음 레벨까지 필요한 경험치',
    progress_percentage INT NOT NULL DEFAULT 0 COMMENT '현재 레벨 진행률 (%)',
    last_level_up_at DATETIME NULL COMMENT '마지막 레벨업 시간',
    total_level_ups INT NOT NULL DEFAULT 0 COMMENT '총 레벨업 횟수',
    highest_level INT NOT NULL DEFAULT 1 COMMENT '최고 레벨',
    experience_history JSON NULL COMMENT '경험치 획득 이력',
    achievements JSON NULL COMMENT '획득한 성취도',
    daily_experience INT NOT NULL DEFAULT 0 COMMENT '오늘 획득한 경험치',
    weekly_experience INT NOT NULL DEFAULT 0 COMMENT '이번 주 획득한 경험치',
    monthly_experience INT NOT NULL DEFAULT 0 COMMENT '이번 달 획득한 경험치',
    last_experience_reset DATETIME NULL COMMENT '마지막 경험치 리셋 시간',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- 외래키 제약조건
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- 유니크 제약조건
    UNIQUE KEY unique_user_experience (user_id),
    
    -- 인덱스
    INDEX idx_user_experience_user_id (user_id),
    INDEX idx_user_experience_level (level),
    INDEX idx_user_experience_total_exp (total_experience),
    INDEX idx_user_experience_last_level_up (last_level_up_at),
    INDEX idx_user_experience_user_level (user_id, level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='사용자 경험치 및 레벨 관리';

-- 초기 데이터 삽입 (기존 사용자들을 위한 기본 경험치 설정)
INSERT IGNORE INTO user_experience (
    user_id, 
    total_experience, 
    level, 
    current_level_exp, 
    exp_to_next_level, 
    progress_percentage,
    total_level_ups,
    highest_level,
    daily_experience,
    weekly_experience,
    monthly_experience,
    last_experience_reset
)
SELECT 
    u.id as user_id,
    0 as total_experience,
    1 as level,
    0 as current_level_exp,
    100 as exp_to_next_level,
    0 as progress_percentage,
    0 as total_level_ups,
    1 as highest_level,
    0 as daily_experience,
    0 as weekly_experience,
    0 as monthly_experience,
    NOW() as last_experience_reset
FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM user_experience ue WHERE ue.user_id = u.id
);

-- 경험치 계산을 위한 뷰 생성
CREATE OR REPLACE VIEW user_level_stats AS
SELECT 
    ue.user_id,
    u.username,
    ue.level,
    ue.total_experience,
    ue.current_level_exp,
    ue.exp_to_next_level,
    ue.progress_percentage,
    ue.total_level_ups,
    ue.highest_level,
    ue.daily_experience,
    ue.weekly_experience,
    ue.monthly_experience,
    ue.last_level_up_at,
    -- 다음 레벨까지 필요한 경험치 계산
    CASE 
        WHEN ue.level = 1 THEN 100 - ue.current_level_exp
        ELSE (100 * POW(2, ue.level - 1)) - ue.current_level_exp
    END as exp_needed_to_next_level,
    -- 레벨별 최대 경험치
    CASE 
        WHEN ue.level = 1 THEN 100
        ELSE 100 * POW(2, ue.level - 1)
    END as max_experience_for_level,
    -- 다음 레벨의 최대 경험치
    100 * POW(2, ue.level) as next_level_max_experience
FROM user_experience ue
JOIN users u ON u.id = ue.user_id;

-- 경험치 순위 뷰 생성
CREATE OR REPLACE VIEW experience_ranking AS
SELECT 
    ue.user_id,
    u.username,
    ue.level,
    ue.total_experience,
    ue.highest_level,
    ROW_NUMBER() OVER (ORDER BY ue.level DESC, ue.total_experience DESC) as rank_position,
    ue.last_level_up_at
FROM user_experience ue
JOIN users u ON u.id = ue.user_id
ORDER BY ue.level DESC, ue.total_experience DESC;

-- 경험치 이력 테이블 (선택사항 - 상세한 경험치 이력을 저장)
CREATE TABLE IF NOT EXISTS experience_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    experience_gained INT NOT NULL COMMENT '획득한 경험치',
    experience_source ENUM('problem_solve', 'level_up_bonus', 'achievement', 'admin_grant', 'other') NOT NULL DEFAULT 'problem_solve' COMMENT '경험치 획득 소스',
    source_id VARCHAR(255) NULL COMMENT '소스 ID (문제 ID, 성취도 ID 등)',
    source_data JSON NULL COMMENT '소스 관련 데이터',
    old_level INT NOT NULL COMMENT '이전 레벨',
    new_level INT NOT NULL COMMENT '새로운 레벨',
    leveled_up BOOLEAN NOT NULL DEFAULT FALSE COMMENT '레벨업 여부',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_experience_history_user_id (user_id),
    INDEX idx_experience_history_created_at (created_at),
    INDEX idx_experience_history_source (experience_source)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='경험치 획득 이력';

-- 성취도 테이블 (선택사항 - 사용자 성취도 관리)
CREATE TABLE IF NOT EXISTS achievements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL COMMENT '성취도 이름',
    description TEXT NULL COMMENT '성취도 설명',
    category ENUM('level', 'experience', 'problem_solve', 'streak', 'special') NOT NULL DEFAULT 'problem_solve' COMMENT '성취도 카테고리',
    condition_data JSON NOT NULL COMMENT '달성 조건 데이터',
    reward_experience INT NOT NULL DEFAULT 0 COMMENT '보상 경험치',
    reward_data JSON NULL COMMENT '추가 보상 데이터',
    icon VARCHAR(100) NULL COMMENT '성취도 아이콘',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT '활성화 여부',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_achievement_name (name),
    INDEX idx_achievements_category (category),
    INDEX idx_achievements_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='성취도 정의';

-- 사용자 성취도 획득 테이블
CREATE TABLE IF NOT EXISTS user_achievements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    achievement_id INT NOT NULL,
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_achievement (user_id, achievement_id),
    INDEX idx_user_achievements_user_id (user_id),
    INDEX idx_user_achievements_earned_at (earned_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='사용자 성취도 획득 기록';

-- 기본 성취도 데이터 삽입
INSERT INTO achievements (name, description, category, condition_data, reward_experience, icon) VALUES
('첫 문제 해결', '첫 번째 문제를 해결했습니다', 'problem_solve', '{"problems_solved": 1}', 50, '🎯'),
('레벨 5 달성', '5레벨에 도달했습니다', 'level', '{"level": 5}', 100, '⭐'),
('레벨 10 달성', '10레벨에 도달했습니다', 'level', '{"level": 10}', 200, '🌟'),
('레벨 20 달성', '20레벨에 도달했습니다', 'level', '{"level": 20}', 500, '💫'),
('경험치 마스터', '1000 경험치를 획득했습니다', 'experience', '{"total_experience": 1000}', 100, '💎'),
('연속 학습자', '7일 연속으로 문제를 해결했습니다', 'streak', '{"consecutive_days": 7}', 150, '🔥'),
('완벽한 해결', '100점 만점으로 문제를 해결했습니다', 'problem_solve', '{"perfect_score": 1}', 75, '💯'),
('빠른 해결사', '5분 이내에 문제를 해결했습니다', 'problem_solve', '{"solve_time_seconds": 300}', 60, '⚡'),
('다양한 문제 해결사', '5가지 다른 유형의 문제를 해결했습니다', 'problem_solve', '{"unique_problem_types": 5}', 120, '🎨'),
('레벨 50 달성', '50레벨에 도달했습니다', 'level', '{"level": 50}', 1000, '👑');

-- 경험치 시스템 설정 테이블
CREATE TABLE IF NOT EXISTS experience_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL,
    setting_value JSON NOT NULL,
    description TEXT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_setting_key (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='경험치 시스템 설정';

-- 기본 경험치 시스템 설정 삽입
INSERT INTO experience_settings (setting_key, setting_value, description) VALUES
('base_experience', '{"level_0": 10, "level_1": 15, "level_2": 20, "level_3": 25, "level_4": 30, "level_5": 35}', '레벨별 기본 경험치'),
('correct_multiplier', '1.5', '정답 시 경험치 배수'),
('wrong_multiplier', '0.3', '오답 시 경험치 배수'),
('first_attempt_bonus', '1.3', '첫 시도 정답 보너스 배수'),
('score_bonus', '{"90+": 1.2, "80+": 1.1, "default": 1.0}', '점수별 보너스 배수'),
('problem_type_multiplier', '{"block": 1.0, "cloze": 1.1, "code_editor": 1.3, "ordering": 1.2, "bug_fix": 1.4}', '문제 유형별 경험치 배수'),
('time_bonus', '{"max_time_seconds": 300, "min_multiplier": 0.8}', '시간 보너스 설정'),
('level_up_rewards', '{"5": 50, "10": 100, "20": 200, "50": 500, "100": 1000}', '레벨업 보상 경험치'),
('daily_reset_time', '00:00:00', '일일 경험치 리셋 시간'),
('weekly_reset_day', '1', '주간 경험치 리셋 요일 (1=월요일)'),
('monthly_reset_day', '1', '월간 경험치 리셋 일 (1일)');

-- 경험치 시스템 통계를 위한 프로시저 생성
DELIMITER //

CREATE PROCEDURE GetUserExperienceStats(IN user_id_param INT)
BEGIN
    SELECT 
        ue.user_id,
        u.username,
        ue.level,
        ue.total_experience,
        ue.current_level_exp,
        ue.exp_to_next_level,
        ue.progress_percentage,
        ue.total_level_ups,
        ue.highest_level,
        ue.daily_experience,
        ue.weekly_experience,
        ue.monthly_experience,
        ue.last_level_up_at,
        -- 추가 통계
        (SELECT COUNT(*) FROM experience_history eh WHERE eh.user_id = ue.user_id) as total_experience_gains,
        (SELECT SUM(eh.experience_gained) FROM experience_history eh WHERE eh.user_id = ue.user_id AND DATE(eh.created_at) = CURDATE()) as today_gained,
        (SELECT SUM(eh.experience_gained) FROM experience_history eh WHERE eh.user_id = ue.user_id AND eh.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)) as week_gained,
        (SELECT SUM(eh.experience_gained) FROM experience_history eh WHERE eh.user_id = ue.user_id AND eh.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)) as month_gained
    FROM user_experience ue
    JOIN users u ON u.id = ue.user_id
    WHERE ue.user_id = user_id_param;
END //

DELIMITER ;

-- 경험치 시스템 초기화를 위한 프로시저 생성
DELIMITER //

CREATE PROCEDURE InitializeUserExperience(IN user_id_param INT)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- 사용자 경험치 정보가 없으면 생성
    INSERT IGNORE INTO user_experience (
        user_id, 
        total_experience, 
        level, 
        current_level_exp, 
        exp_to_next_level, 
        progress_percentage,
        total_level_ups,
        highest_level,
        daily_experience,
        weekly_experience,
        monthly_experience,
        last_experience_reset
    ) VALUES (
        user_id_param,
        0,
        1,
        0,
        100,
        0,
        0,
        1,
        0,
        0,
        0,
        NOW()
    );
    
    COMMIT;
END //

DELIMITER ;
