-- =====================================================
-- Gpters 코딩 교육 플랫폼 ERD Cloud용 스키마
-- =====================================================

-- 1. USERS 테이블 (사용자)
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(100),
    password_hash VARCHAR(255),
    
    -- 소셜 로그인
    provider ENUM('local', 'google', 'kakao', 'github') DEFAULT 'local',
    provider_id VARCHAR(100),
    profile_image_url TEXT,
    
    -- 레벨 및 경험치
    current_level INT DEFAULT 0,
    experience_points INT DEFAULT 0,
    
    -- 설문조사 완료 여부
    survey_completed BOOLEAN DEFAULT FALSE,
    
    -- 계정 상태
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMP NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. SURVEYS 테이블 (온보딩 설문조사)
CREATE TABLE surveys (
    survey_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    job_title VARCHAR(100),
    learning_purpose TEXT,
    current_skill_level INT,
    motivation TEXT,
    time_availability VARCHAR(50),
    preferred_language VARCHAR(50),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 3. PROBLEMS 테이블 (문제)
CREATE TABLE problems (
    problem_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    
    -- 문제 분류
    level INT NOT NULL,
    category VARCHAR(50) NOT NULL,
    problem_type ENUM('block_coding', 'fill_blank', 'code_editor', 'level_test') NOT NULL,
    difficulty ENUM('beginner', 'intermediate', 'advanced') DEFAULT 'beginner',
    
    -- 문제 내용
    problem_content TEXT,
    solution TEXT,
    test_cases TEXT,
    hints TEXT,
    
    -- 문제 평가
    rating DECIMAL(3,2) DEFAULT 0.00,
    rating_count INT DEFAULT 0,
    
    -- 문제 상태
    is_active BOOLEAN DEFAULT TRUE,
    is_leveltest BOOLEAN DEFAULT FALSE,
    
    estimated_time_minutes INT DEFAULT 30,
    tags TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 4. SUBMISSIONS 테이블 (제출)
CREATE TABLE submissions (
    submission_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    problem_id INT NOT NULL,
    
    submitted_code TEXT,
    result ENUM('correct', 'incorrect', 'error', 'timeout') NOT NULL,
    score INT DEFAULT 0,
    
    execution_time_ms INT DEFAULT 0,
    memory_usage_kb INT DEFAULT 0,
    error_message TEXT,
    
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (problem_id) REFERENCES problems(problem_id) ON DELETE CASCADE
);

-- 5. ATTENDANCE 테이블 (출석)
CREATE TABLE attendance (
    attendance_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    attendance_date DATE NOT NULL,
    is_present BOOLEAN DEFAULT TRUE,
    problems_solved INT DEFAULT 0,
    time_spent_minutes INT DEFAULT 0,
    streak_count INT DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 6. LEAGUES 테이블 (리그전)
CREATE TABLE leagues (
    league_id INT AUTO_INCREMENT PRIMARY KEY,
    season VARCHAR(50) NOT NULL,
    league_name VARCHAR(100) NOT NULL,
    description TEXT,
    
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    
    status ENUM('upcoming', 'active', 'completed') DEFAULT 'upcoming',
    max_participants INT DEFAULT 100,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 7. USER_LEAGUE_PARTICIPATION 테이블 (리그 참여)
CREATE TABLE user_league_participation (
    participation_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    league_id INT NOT NULL,
    
    score INT DEFAULT 0,
    rank_position INT DEFAULT 0,
    problems_solved INT DEFAULT 0,
    time_spent_minutes INT DEFAULT 0,
    
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (league_id) REFERENCES leagues(league_id) ON DELETE CASCADE
);

-- 8. PROBLEM_EVALUATIONS 테이블 (문제 평가)
CREATE TABLE problem_evaluations (
    evaluation_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    problem_id INT NOT NULL,
    rating INT,
    feedback TEXT,
    is_reported BOOLEAN DEFAULT FALSE,
    report_reason TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (problem_id) REFERENCES problems(problem_id) ON DELETE CASCADE
);

-- 9. PAYMENTS 테이블 (결제 및 환급)
CREATE TABLE payments (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'KRW',
    payment_method VARCHAR(50),
    
    status ENUM('pending', 'completed', 'failed', 'refunded', 'partially_refunded') DEFAULT 'pending',
    
    external_payment_id VARCHAR(100),
    payment_gateway VARCHAR(50),
    
    refund_amount DECIMAL(10,2) DEFAULT 0.00,
    refund_reason TEXT,
    refund_processed_at TIMESTAMP NULL,
    
    billing_period_start DATE,
    billing_period_end DATE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 10. STATISTICS 테이블 (통계)
CREATE TABLE statistics (
    stat_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    
    period_type ENUM('daily', 'weekly', 'monthly') NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    problems_solved INT DEFAULT 0,
    problems_attempted INT DEFAULT 0,
    correct_submissions INT DEFAULT 0,
    total_submissions INT DEFAULT 0,
    time_spent_minutes INT DEFAULT 0,
    streak_days INT DEFAULT 0,
    
    detailed_stats TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
); 