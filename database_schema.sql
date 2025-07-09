-- =====================================================
-- Gpters 코딩 교육 플랫폼 데이터베이스 스키마
-- PostgreSQL 기반 DDL
-- =====================================================

-- 확장 기능 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 1. USERS 테이블 (사용자)
-- =====================================================
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(100),
    password_hash VARCHAR(255), -- 로컬 회원가입용
    
    -- 소셜 로그인 정보
    provider VARCHAR(20) NOT NULL DEFAULT 'local', -- 'local', 'google', 'kakao', 'github'
    provider_id VARCHAR(100),
    
    -- 게임 데이터
    current_level INTEGER NOT NULL DEFAULT 0 CHECK (current_level >= 0 AND current_level <= 5),
    experience_points INTEGER NOT NULL DEFAULT 0 CHECK (experience_points >= 0),
    total_experience INTEGER NOT NULL DEFAULT 0 CHECK (total_experience >= 0),
    
    -- 메타데이터
    profile_data JSONB DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE,
    
    -- 제약조건
    CONSTRAINT valid_provider CHECK (provider IN ('local', 'google', 'kakao', 'github')),
    CONSTRAINT social_login_provider_id CHECK (
        (provider = 'local' AND provider_id IS NULL) OR 
        (provider != 'local' AND provider_id IS NOT NULL)
    )
);

-- 인덱스
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_provider ON users(provider, provider_id);
CREATE INDEX idx_users_level ON users(current_level);
CREATE INDEX idx_users_created_at ON users(created_at);

-- =====================================================
-- 2. SURVEYS 테이블 (온보딩 설문조사)
-- =====================================================
CREATE TABLE surveys (
    survey_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    
    -- 4단계 설문 데이터
    job VARCHAR(100), -- 직업
    purpose VARCHAR(100), -- 목적
    estimated_level INTEGER CHECK (estimated_level >= 0 AND estimated_level <= 5), -- 예상 레벨
    motivation TEXT, -- 가입 동기
    
    additional_data JSONB DEFAULT '{}', -- 추가 설문 데이터
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_user_survey UNIQUE(user_id)
);

-- 인덱스
CREATE INDEX idx_surveys_user_id ON surveys(user_id);

-- =====================================================
-- 3. PROBLEMS 테이블 (문제)
-- =====================================================
CREATE TABLE problems (
    problem_id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    content TEXT NOT NULL, -- 문제 내용 (HTML/Markdown)
    
    -- 문제 분류
    level INTEGER NOT NULL CHECK (level >= 0 AND level <= 5),
    category VARCHAR(50) NOT NULL, -- 'variables', 'loops', 'functions', etc.
    difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
    problem_type VARCHAR(30) NOT NULL CHECK (problem_type IN ('block_coding', 'fill_blank', 'code_editor', 'level_test')),
    
    -- 문제 데이터
    test_cases JSONB NOT NULL DEFAULT '[]', -- 테스트 케이스들
    solution JSONB NOT NULL DEFAULT '{}', -- 정답 코드/해설
    hints JSONB DEFAULT '[]', -- 힌트들
    
    -- 평가 데이터
    rating DECIMAL(3,2) DEFAULT 0.00 CHECK (rating >= 0 AND rating <= 5.00),
    rating_count INTEGER DEFAULT 0 CHECK (rating_count >= 0),
    
    -- 상태
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_leveltest BOOLEAN NOT NULL DEFAULT false, -- 레벨테스트 문제 여부
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스
CREATE INDEX idx_problems_level ON problems(level);
CREATE INDEX idx_problems_category ON problems(category);
CREATE INDEX idx_problems_type ON problems(problem_type);
CREATE INDEX idx_problems_difficulty ON problems(difficulty);
CREATE INDEX idx_problems_rating ON problems(rating DESC);
CREATE INDEX idx_problems_leveltest ON problems(is_leveltest);
CREATE INDEX idx_problems_active ON problems(is_active);

-- =====================================================
-- 4. SUBMISSIONS 테이블 (문제 제출)
-- =====================================================
CREATE TABLE submissions (
    submission_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    problem_id INTEGER NOT NULL REFERENCES problems(problem_id) ON DELETE CASCADE,
    
    -- 제출 데이터
    user_code TEXT, -- 사용자가 작성한 코드
    result VARCHAR(20) NOT NULL CHECK (result IN ('correct', 'incorrect', 'timeout', 'error', 'partial')),
    score INTEGER NOT NULL DEFAULT 0 CHECK (score >= 0 AND score <= 100),
    time_taken INTEGER NOT NULL DEFAULT 0 CHECK (time_taken >= 0), -- 소요 시간 (초)
    
    -- 실행 결과 상세
    execution_details JSONB DEFAULT '{}', -- 테스트 케이스별 결과 등
    feedback TEXT, -- AI 피드백 (선택적)
    
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스
CREATE INDEX idx_submissions_user_id ON submissions(user_id);
CREATE INDEX idx_submissions_problem_id ON submissions(problem_id);
CREATE INDEX idx_submissions_result ON submissions(result);
CREATE INDEX idx_submissions_submitted_at ON submissions(submitted_at);
CREATE INDEX idx_submissions_user_problem ON submissions(user_id, problem_id);

-- =====================================================
-- 5. ATTENDANCE 테이블 (출석 기록)
-- =====================================================
CREATE TABLE attendance (
    attendance_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL,
    
    -- 출석 데이터
    is_present BOOLEAN NOT NULL DEFAULT false,
    problems_solved INTEGER NOT NULL DEFAULT 0 CHECK (problems_solved >= 0),
    first_activity TIMESTAMP WITH TIME ZONE,
    last_activity TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT unique_user_date UNIQUE(user_id, attendance_date)
);

-- 인덱스
CREATE INDEX idx_attendance_user_id ON attendance(user_id);
CREATE INDEX idx_attendance_date ON attendance(attendance_date);
CREATE INDEX idx_attendance_user_date ON attendance(user_id, attendance_date);

-- =====================================================
-- 6. LEAGUES 테이블 (리그전)
-- =====================================================
CREATE TABLE leagues (
    league_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    season VARCHAR(50) NOT NULL, -- 'YYYY-MM-W1', 'YYYY-MM-W2' 형식
    
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'ended')),
    
    rules JSONB DEFAULT '{}', -- 리그 규칙 설정
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_league_dates CHECK (end_date > start_date)
);

-- 인덱스
CREATE INDEX idx_leagues_season ON leagues(season);
CREATE INDEX idx_leagues_status ON leagues(status);
CREATE INDEX idx_leagues_dates ON leagues(start_date, end_date);

-- =====================================================
-- 7. USER_LEAGUE_PARTICIPATION 테이블 (리그 참여)
-- =====================================================
CREATE TABLE user_league_participation (
    participation_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    league_id INTEGER NOT NULL REFERENCES leagues(league_id) ON DELETE CASCADE,
    
    -- 리그 성과
    score INTEGER NOT NULL DEFAULT 0 CHECK (score >= 0),
    rank INTEGER, -- NULL = 순위 미확정
    
    -- 참여 메타데이터
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT unique_user_league UNIQUE(user_id, league_id)
);

-- 인덱스
CREATE INDEX idx_participation_user_id ON user_league_participation(user_id);
CREATE INDEX idx_participation_league_id ON user_league_participation(league_id);
CREATE INDEX idx_participation_score ON user_league_participation(league_id, score DESC);
CREATE INDEX idx_participation_rank ON user_league_participation(league_id, rank);

-- =====================================================
-- 8. PROBLEM_EVALUATIONS 테이블 (문제 평가)
-- =====================================================
CREATE TABLE problem_evaluations (
    evaluation_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    problem_id INTEGER NOT NULL REFERENCES problems(problem_id) ON DELETE CASCADE,
    
    -- 평가 데이터
    rating VARCHAR(10) NOT NULL CHECK (rating IN ('boom_up', 'boom_down')), -- 붐업/붐따
    comment TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_user_problem_evaluation UNIQUE(user_id, problem_id)
);

-- 인덱스
CREATE INDEX idx_evaluations_problem_id ON problem_evaluations(problem_id);
CREATE INDEX idx_evaluations_rating ON problem_evaluations(rating);

-- =====================================================
-- 9. PAYMENTS 테이블 (결제/환급)
-- =====================================================
CREATE TABLE payments (
    payment_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    
    -- 결제 정보
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'KRW',
    payment_method VARCHAR(50), -- 'card', 'bank_transfer', etc.
    
    -- 결제 상태
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    transaction_id VARCHAR(255) UNIQUE,
    
    -- 환급 관련
    billing_period_start DATE NOT NULL,
    billing_period_end DATE NOT NULL,
    refund_eligible BOOLEAN NOT NULL DEFAULT true,
    refund_amount DECIMAL(10,2) DEFAULT 0 CHECK (refund_amount >= 0),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_billing_period CHECK (billing_period_end > billing_period_start),
    CONSTRAINT valid_refund_amount CHECK (refund_amount <= amount)
);

-- 인덱스
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_billing_period ON payments(billing_period_start, billing_period_end);

-- =====================================================
-- 10. STATISTICS 테이블 (학습 통계)
-- =====================================================
CREATE TABLE statistics (
    stat_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    
    -- 통계 기간
    period_type VARCHAR(20) NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly')),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- 통계 데이터
    problems_solved INTEGER NOT NULL DEFAULT 0 CHECK (problems_solved >= 0),
    total_time_spent INTEGER NOT NULL DEFAULT 0 CHECK (total_time_spent >= 0), -- 초 단위
    accuracy_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00 CHECK (accuracy_rate >= 0 AND accuracy_rate <= 100),
    
    -- JSON 형태의 상세 통계
    level_progress JSONB DEFAULT '{}', -- 레벨별 진도
    weak_areas JSONB DEFAULT '[]', -- 약점 영역
    strength_areas JSONB DEFAULT '[]', -- 강점 영역
    
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_period CHECK (period_end >= period_start),
    CONSTRAINT unique_user_period UNIQUE(user_id, period_type, period_start, period_end)
);

-- 인덱스
CREATE INDEX idx_statistics_user_id ON statistics(user_id);
CREATE INDEX idx_statistics_period ON statistics(period_type, period_start, period_end);

-- =====================================================
-- 트리거 및 함수
-- =====================================================

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- updated_at 트리거 적용
CREATE TRIGGER update_users_modtime BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_problems_modtime BEFORE UPDATE ON problems 
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_payments_modtime BEFORE UPDATE ON payments 
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- =====================================================
-- 초기 데이터
-- =====================================================

-- 기본 문제 카테고리를 위한 샘플 데이터
INSERT INTO problems (title, description, content, level, category, difficulty, problem_type, test_cases, solution, is_leveltest) VALUES
('변수와 출력', '변수를 사용해서 "Hello, World!"를 출력하세요', '<p>변수를 사용해서 "Hello, World!"를 출력하는 프로그램을 작성하세요.</p>', 0, 'variables', 'easy', 'block_coding', 
 '[{"input": "", "expected_output": "Hello, World!"}]', 
 '{"code": "message = \"Hello, World!\"\nprint(message)", "explanation": "변수에 문자열을 저장하고 출력합니다."}', true),

('조건문 기초', 'if문을 사용해서 숫자가 짝수인지 홀수인지 판별하세요', '<p>입력받은 숫자가 짝수인지 홀수인지 판별하는 프로그램을 작성하세요.</p>', 2, 'conditionals', 'easy', 'fill_blank',
 '[{"input": "4", "expected_output": "짝수"}, {"input": "5", "expected_output": "홀수"}]',
 '{"code": "n = int(input())\nif n % 2 == 0:\n    print(\"짝수\")\nelse:\n    print(\"홀수\")", "explanation": "모듈로 연산자로 짝수/홀수를 판별합니다."}', true);

-- 관리자 계정 (선택적)
INSERT INTO users (email, username, full_name, current_level, experience_points, total_experience) VALUES
('admin@gpters.com', 'admin', 'Gpters Admin', 5, 0, 45000);

-- =====================================================
-- 뷰 (View) 정의
-- =====================================================

-- 사용자 학습 현황 뷰
CREATE VIEW user_learning_status AS
SELECT 
    u.user_id,
    u.username,
    u.current_level,
    u.experience_points,
    u.total_experience,
    COUNT(DISTINCT s.submission_id) as total_submissions,
    COUNT(DISTINCT CASE WHEN s.result = 'correct' THEN s.submission_id END) as correct_submissions,
    COUNT(DISTINCT a.attendance_date) as total_attendance_days,
    COALESCE(AVG(s.score), 0) as average_score
FROM users u
LEFT JOIN submissions s ON u.user_id = s.user_id
LEFT JOIN attendance a ON u.user_id = a.user_id AND a.is_present = true
GROUP BY u.user_id, u.username, u.current_level, u.experience_points, u.total_experience;

-- 문제별 통계 뷰
CREATE VIEW problem_statistics AS
SELECT 
    p.problem_id,
    p.title,
    p.level,
    p.category,
    p.difficulty,
    COUNT(s.submission_id) as total_submissions,
    COUNT(CASE WHEN s.result = 'correct' THEN 1 END) as correct_submissions,
    ROUND(COUNT(CASE WHEN s.result = 'correct' THEN 1 END) * 100.0 / NULLIF(COUNT(s.submission_id), 0), 2) as success_rate,
    AVG(s.score) as average_score,
    COUNT(pe.evaluation_id) as total_evaluations,
    COUNT(CASE WHEN pe.rating = 'boom_up' THEN 1 END) as boom_up_count
FROM problems p
LEFT JOIN submissions s ON p.problem_id = s.problem_id
LEFT JOIN problem_evaluations pe ON p.problem_id = pe.problem_id
GROUP BY p.problem_id, p.title, p.level, p.category, p.difficulty;

-- =====================================================
-- 인덱스 최적화 (추가)
-- =====================================================

-- 복합 인덱스들
CREATE INDEX idx_submissions_user_result_date ON submissions(user_id, result, submitted_at);
CREATE INDEX idx_attendance_user_present ON attendance(user_id, is_present, attendance_date);
CREATE INDEX idx_problems_level_active ON problems(level, is_active);
CREATE INDEX idx_statistics_user_period_type ON statistics(user_id, period_type);

-- =====================================================
-- 완료
-- =====================================================
-- 스키마 생성이 완료되었습니다.
-- 이 스키마는 Gpters 코딩 교육 플랫폼의 모든 핵심 기능을 지원합니다:
-- 1. 사용자 관리 및 소셜 로그인
-- 2. 적응형 레벨 시스템 (0-5단계)
-- 3. 문제 관리 및 다양한 제출 방식
-- 4. 출석체크 및 학습 추적
-- 5. 리그전 시스템
-- 6. 결제 및 환급 시스템
-- 7. 학습 통계 및 분석
-- 8. 문제 평가 시스템 