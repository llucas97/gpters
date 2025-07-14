-- =====================================================
-- Gpters 코딩 교육 플랫폼 데이터베이스 스키마
-- MySQL 기반 DDL
-- =====================================================

-- MySQL 설정
SET sql_mode = 'STRICT_TRANS_TABLES,NO_ZERO_DATE,NO_ZERO_IN_DATE,ERROR_FOR_DIVISION_BY_ZERO';

-- =====================================================
-- 1. USERS 테이블 (사용자)
-- =====================================================
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(100),
    password_hash VARCHAR(255), -- 로컬 회원가입용
    
    -- 소셜 로그인 정보
    provider ENUM('local', 'google', 'kakao', 'github') DEFAULT 'local',
    provider_id VARCHAR(100),
    profile_image_url TEXT,
    
    -- 레벨 및 경험치
    current_level INT DEFAULT 0 CHECK (current_level >= 0 AND current_level <= 5),
    experience_points INT DEFAULT 0 CHECK (experience_points >= 0),
    
    -- 설문조사 완료 여부
    survey_completed BOOLEAN DEFAULT FALSE,
    
    -- 계정 상태
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMP NULL,
    
    -- 타임스탬프
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- 고유 제약조건
    UNIQUE KEY unique_provider_id (provider, provider_id)
);

-- 사용자 테이블 인덱스
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_provider ON users(provider, provider_id);
CREATE INDEX idx_users_level ON users(current_level);
CREATE INDEX idx_users_created_at ON users(created_at);

-- =====================================================
-- 2. SURVEYS 테이블 (온보딩 설문조사)
-- =====================================================
CREATE TABLE surveys (
    survey_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    job_title VARCHAR(100),
    learning_purpose TEXT,
    current_skill_level INT CHECK (current_skill_level >= 0 AND current_skill_level <= 5),
    motivation TEXT,
    time_availability VARCHAR(50), -- '1-2 hours', '3-4 hours', '5+ hours'
    preferred_language VARCHAR(50), -- 'Python', 'JavaScript', 'Java' 등
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE INDEX idx_surveys_user_id ON surveys(user_id);

-- =====================================================
-- 3. PROBLEMS 테이블 (문제)
-- =====================================================
CREATE TABLE problems (
    problem_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    
    -- 문제 분류
    level INT NOT NULL CHECK (level >= 0 AND level <= 5),
    category VARCHAR(50) NOT NULL, -- 'loops', 'conditionals', 'functions' 등
    problem_type ENUM('block_coding', 'fill_blank', 'code_editor', 'level_test') NOT NULL,
    difficulty ENUM('beginner', 'intermediate', 'advanced') DEFAULT 'beginner',
    
    -- 문제 내용
    problem_content JSON, -- 문제별 데이터 (블록, 빈칸, 코드 등)
    solution TEXT, -- 정답 또는 해법
    test_cases JSON, -- 테스트 케이스들
    hints JSON, -- 힌트들
    
    -- 문제 평가
    rating DECIMAL(3,2) DEFAULT 0.00 CHECK (rating >= 0 AND rating <= 5),
    rating_count INT DEFAULT 0,
    
    -- 문제 상태
    is_active BOOLEAN DEFAULT TRUE,
    is_leveltest BOOLEAN DEFAULT FALSE, -- 레벨테스트용 문제인지
    
    -- 메타데이터
    estimated_time_minutes INT DEFAULT 30,
    tags JSON, -- 추가 태그들
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 문제 테이블 인덱스
CREATE INDEX idx_problems_level ON problems(level);
CREATE INDEX idx_problems_category ON problems(category);
CREATE INDEX idx_problems_type ON problems(problem_type);
CREATE INDEX idx_problems_difficulty ON problems(difficulty);
CREATE INDEX idx_problems_rating ON problems(rating DESC);
CREATE INDEX idx_problems_leveltest ON problems(is_leveltest);
CREATE INDEX idx_problems_active ON problems(is_active);

-- =====================================================
-- 4. SUBMISSIONS 테이블 (제출)
-- =====================================================
CREATE TABLE submissions (
    submission_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    problem_id INT NOT NULL,
    
    submitted_code TEXT,
    result ENUM('correct', 'incorrect', 'error', 'timeout') NOT NULL,
    score INT DEFAULT 0 CHECK (score >= 0 AND score <= 100),
    
    execution_time_ms INT DEFAULT 0,
    memory_usage_kb INT DEFAULT 0,
    error_message TEXT,
    
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (problem_id) REFERENCES problems(problem_id) ON DELETE CASCADE
);

-- 제출 테이블 인덱스
CREATE INDEX idx_submissions_user_id ON submissions(user_id);
CREATE INDEX idx_submissions_problem_id ON submissions(problem_id);
CREATE INDEX idx_submissions_result ON submissions(result);
CREATE INDEX idx_submissions_submitted_at ON submissions(submitted_at);
CREATE INDEX idx_submissions_user_problem ON submissions(user_id, problem_id);

-- =====================================================
-- 5. ATTENDANCE 테이블 (출석)
-- =====================================================
CREATE TABLE attendance (
    attendance_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    attendance_date DATE NOT NULL,
    is_present BOOLEAN DEFAULT TRUE,
    problems_solved INT DEFAULT 0,
    time_spent_minutes INT DEFAULT 0,
    streak_count INT DEFAULT 0, -- 연속 출석일
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_date (user_id, attendance_date)
);

-- 출석 테이블 인덱스
CREATE INDEX idx_attendance_user_id ON attendance(user_id);
CREATE INDEX idx_attendance_date ON attendance(attendance_date);
CREATE INDEX idx_attendance_user_date ON attendance(user_id, attendance_date);

-- =====================================================
-- 6. LEAGUES 테이블 (리그전)
-- =====================================================
CREATE TABLE leagues (
    league_id INT AUTO_INCREMENT PRIMARY KEY,
    season VARCHAR(50) NOT NULL, -- '2024-W01', '2024-W02' 등
    league_name VARCHAR(100) NOT NULL,
    description TEXT,
    
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    
    status ENUM('upcoming', 'active', 'completed') DEFAULT 'upcoming',
    max_participants INT DEFAULT 100,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 리그 테이블 인덱스
CREATE INDEX idx_leagues_season ON leagues(season);
CREATE INDEX idx_leagues_status ON leagues(status);
CREATE INDEX idx_leagues_dates ON leagues(start_date, end_date);

-- =====================================================
-- 7. USER_LEAGUE_PARTICIPATION 테이블 (리그 참여)
-- =====================================================
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
    FOREIGN KEY (league_id) REFERENCES leagues(league_id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_league (user_id, league_id)
);

-- 리그 참여 테이블 인덱스
CREATE INDEX idx_participation_user_id ON user_league_participation(user_id);
CREATE INDEX idx_participation_league_id ON user_league_participation(league_id);
CREATE INDEX idx_participation_score ON user_league_participation(league_id, score DESC);
CREATE INDEX idx_participation_rank ON user_league_participation(league_id, rank_position);

-- =====================================================
-- 8. PROBLEM_EVALUATIONS 테이블 (문제 평가)
-- =====================================================
CREATE TABLE problem_evaluations (
    evaluation_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    problem_id INT NOT NULL,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    feedback TEXT,
    is_reported BOOLEAN DEFAULT FALSE,
    report_reason TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (problem_id) REFERENCES problems(problem_id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_problem_eval (user_id, problem_id)
);

-- 문제 평가 테이블 인덱스
CREATE INDEX idx_evaluations_problem_id ON problem_evaluations(problem_id);
CREATE INDEX idx_evaluations_rating ON problem_evaluations(rating);

-- =====================================================
-- 9. PAYMENTS 테이블 (결제 및 환급)
-- =====================================================
CREATE TABLE payments (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    
    -- 결제 정보
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'KRW',
    payment_method VARCHAR(50), -- 'card', 'bank_transfer', 'kakaopay' 등
    
    -- 결제 상태
    status ENUM('pending', 'completed', 'failed', 'refunded', 'partially_refunded') DEFAULT 'pending',
    
    -- 외부 결제 시스템 정보
    external_payment_id VARCHAR(100),
    payment_gateway VARCHAR(50), -- 'toss', 'iamport', 'paypal' 등
    
    -- 환급 관련
    refund_amount DECIMAL(10,2) DEFAULT 0.00,
    refund_reason TEXT,
    refund_processed_at TIMESTAMP NULL,
    
    -- 청구 기간
    billing_period_start DATE,
    billing_period_end DATE,
    
    -- 타임스탬프
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 결제 테이블 인덱스
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_billing_period ON payments(billing_period_start, billing_period_end);

-- =====================================================
-- 10. STATISTICS 테이블 (통계)
-- =====================================================
CREATE TABLE statistics (
    stat_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    
    -- 통계 기간
    period_type ENUM('daily', 'weekly', 'monthly') NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- 통계 데이터
    problems_solved INT DEFAULT 0,
    problems_attempted INT DEFAULT 0,
    correct_submissions INT DEFAULT 0,
    total_submissions INT DEFAULT 0,
    time_spent_minutes INT DEFAULT 0,
    streak_days INT DEFAULT 0,
    
    -- JSON 형태의 상세 통계
    detailed_stats JSON,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 통계 테이블 인덱스
CREATE INDEX idx_statistics_user_id ON statistics(user_id);
CREATE INDEX idx_statistics_period ON statistics(period_type, period_start, period_end);

-- =====================================================
-- MySQL 트리거 생성 (updated_at 자동 업데이트는 이미 컬럼 정의에 포함됨)
-- =====================================================

-- =====================================================
-- 뷰 (Views)
-- =====================================================

-- 사용자 학습 현황 뷰
CREATE VIEW user_learning_status AS
SELECT 
    u.user_id,
    u.username,
    u.current_level,
    u.experience_points,
    COUNT(DISTINCT s.submission_id) as total_submissions,
    COUNT(DISTINCT CASE WHEN s.result = 'correct' THEN s.submission_id END) as correct_submissions,
    COUNT(DISTINCT s.problem_id) as unique_problems_attempted,
    AVG(CASE WHEN s.result = 'correct' THEN s.score END) as avg_score,
    MAX(a.streak_count) as max_streak,
    COUNT(DISTINCT a.attendance_date) as total_attendance_days
FROM users u
LEFT JOIN submissions s ON u.user_id = s.user_id
LEFT JOIN attendance a ON u.user_id = a.user_id AND a.is_present = TRUE
GROUP BY u.user_id, u.username, u.current_level, u.experience_points;

-- 문제별 통계 뷰
CREATE VIEW problem_statistics AS
SELECT 
    p.problem_id,
    p.title,
    p.level,
    p.category,
    p.difficulty,
    COUNT(DISTINCT s.user_id) as total_attempts,
    COUNT(DISTINCT CASE WHEN s.result = 'correct' THEN s.user_id END) as successful_users,
    ROUND(
        COUNT(DISTINCT CASE WHEN s.result = 'correct' THEN s.user_id END) * 100.0 / 
        NULLIF(COUNT(DISTINCT s.user_id), 0), 2
    ) as success_rate,
    AVG(s.score) as avg_score,
    AVG(pe.rating) as avg_rating,
    COUNT(pe.evaluation_id) as total_evaluations
FROM problems p
LEFT JOIN submissions s ON p.problem_id = s.problem_id
LEFT JOIN problem_evaluations pe ON p.problem_id = pe.problem_id
WHERE p.is_active = TRUE
GROUP BY p.problem_id, p.title, p.level, p.category, p.difficulty;

-- =====================================================
-- 성능 최적화를 위한 추가 인덱스
-- =====================================================
CREATE INDEX idx_submissions_user_result_date ON submissions(user_id, result, submitted_at);
CREATE INDEX idx_attendance_user_present ON attendance(user_id, is_present, attendance_date);
CREATE INDEX idx_problems_level_active ON problems(level, is_active);
CREATE INDEX idx_statistics_user_period_type ON statistics(user_id, period_type);

-- =====================================================
-- 샘플 데이터 삽입
-- =====================================================

-- 관리자 계정
INSERT INTO users (email, username, full_name, provider, current_level, experience_points, is_active, email_verified)
VALUES ('admin@gpters.com', 'admin', '관리자', 'local', 5, 10000, TRUE, TRUE);

-- 샘플 사용자
INSERT INTO users (email, username, full_name, provider, current_level, experience_points, survey_completed)
VALUES 
('user1@example.com', 'coder1', '김개발', 'google', 2, 150, TRUE),
('user2@example.com', 'pythonista', '이파이썬', 'kakao', 1, 75, TRUE);

-- 샘플 문제
INSERT INTO problems (title, description, level, category, problem_type, difficulty, problem_content, solution, is_active)
VALUES 
('첫 번째 문제', 'Hello World를 출력하는 문제입니다.', 0, 'basic', 'block_coding', 'beginner', '{}', 'print("Hello World")', TRUE),
('반복문 기초', 'for 반복문을 사용하는 문제입니다.', 1, 'loops', 'fill_blank', 'beginner', '{}', 'for i in range(10): print(i)', TRUE); 