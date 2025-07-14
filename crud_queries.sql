-- =====================================================
-- Gpters 플랫폼 기본 CRUD 쿼리 예시
-- MySQL + Redis 연동 고려
-- =====================================================

-- =====================================================
-- 1. USERS 테이블 CRUD
-- =====================================================

-- CREATE: 새 사용자 생성 (소셜 로그인)
INSERT INTO users (email, username, full_name, provider, provider_id, current_level, experience_points)
VALUES ('user@gmail.com', 'coder123', '김개발', 'google', 'google_12345', 0, 0);

-- CREATE: 로컬 회원가입
INSERT INTO users (email, username, full_name, password_hash, provider, current_level, experience_points)
VALUES ('local@example.com', 'localuser', '박로컬', SHA2('password123', 256), 'local', 0, 0);

-- READ: 사용자 정보 조회
SELECT user_id, email, username, full_name, provider, current_level, experience_points, 
       survey_completed, is_active, created_at, last_login
FROM users 
WHERE user_id = 1;

-- READ: 이메일로 사용자 찾기
SELECT user_id, email, username, provider, current_level, experience_points
FROM users 
WHERE email = 'user@gmail.com' AND is_active = TRUE;

-- READ: 소셜 로그인 사용자 찾기
SELECT user_id, email, username, current_level, experience_points
FROM users 
WHERE provider = 'google' AND provider_id = 'google_12345';

-- UPDATE: 사용자 레벨 및 경험치 업데이트
UPDATE users 
SET current_level = 2, experience_points = 250, updated_at = CURRENT_TIMESTAMP
WHERE user_id = 1;

-- UPDATE: 마지막 로그인 시간 업데이트
UPDATE users 
SET last_login = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
WHERE user_id = 1;

-- UPDATE: 설문조사 완료 표시
UPDATE users 
SET survey_completed = TRUE, updated_at = CURRENT_TIMESTAMP
WHERE user_id = 1;

-- DELETE: 사용자 비활성화 (Soft Delete)
UPDATE users 
SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP
WHERE user_id = 1;

-- DELETE: 사용자 완전 삭제 (Hard Delete - 주의)
DELETE FROM users WHERE user_id = 1;

-- =====================================================
-- 2. SURVEYS 테이블 CRUD
-- =====================================================

-- CREATE: 설문조사 결과 저장
INSERT INTO surveys (user_id, job_title, learning_purpose, current_skill_level, motivation, time_availability, preferred_language)
VALUES (1, '소프트웨어 개발자', '업무 스킬 향상', 2, '새로운 도전', '3-4 hours', 'Python');

-- READ: 사용자 설문조사 조회
SELECT survey_id, job_title, learning_purpose, current_skill_level, motivation, 
       time_availability, preferred_language, created_at
FROM surveys 
WHERE user_id = 1;

-- UPDATE: 설문조사 정보 수정
UPDATE surveys 
SET job_title = '데이터 분석가', 
    learning_purpose = '커리어 전환',
    updated_at = CURRENT_TIMESTAMP
WHERE user_id = 1;

-- DELETE: 설문조사 삭제
DELETE FROM surveys WHERE user_id = 1;

-- =====================================================
-- 3. PROBLEMS 테이블 CRUD
-- =====================================================

-- CREATE: 새 문제 생성
INSERT INTO problems (title, description, level, category, problem_type, difficulty, 
                      problem_content, solution, test_cases, hints, estimated_time_minutes, tags)
VALUES (
    '변수와 출력', 
    'Hello World를 출력하는 프로그램을 작성하세요',
    0, 
    'basic', 
    'block_coding', 
    'beginner',
    '{"blocks": ["print", "string"]}',
    'print("Hello World")',
    '[{"input": "", "expected": "Hello World"}]',
    '["문자열을 출력하려면 print() 함수를 사용하세요"]',
    15,
    '["beginner", "basic", "print"]'
);

-- READ: 레벨별 문제 조회
SELECT problem_id, title, description, level, category, problem_type, difficulty, 
       rating, rating_count, estimated_time_minutes
FROM problems 
WHERE level = 1 AND is_active = TRUE
ORDER BY problem_id;

-- READ: 특정 문제 상세 조회
SELECT problem_id, title, description, level, category, problem_type, difficulty,
       problem_content, solution, test_cases, hints, rating, rating_count,
       estimated_time_minutes, tags, created_at
FROM problems 
WHERE problem_id = 1 AND is_active = TRUE;

-- READ: 카테고리별 문제 조회
SELECT problem_id, title, level, difficulty, rating, estimated_time_minutes
FROM problems 
WHERE category = 'loops' AND is_active = TRUE
ORDER BY level, difficulty;

-- READ: 레벨테스트 문제 조회
SELECT problem_id, title, description, level, problem_content, test_cases
FROM problems 
WHERE is_leveltest = TRUE AND is_active = TRUE
ORDER BY level;

-- UPDATE: 문제 정보 수정
UPDATE problems 
SET title = '수정된 제목', 
    description = '수정된 설명',
    difficulty = 'intermediate',
    updated_at = CURRENT_TIMESTAMP
WHERE problem_id = 1;

-- UPDATE: 문제 평가 점수 업데이트
UPDATE problems 
SET rating = (rating * rating_count + 4) / (rating_count + 1),
    rating_count = rating_count + 1,
    updated_at = CURRENT_TIMESTAMP
WHERE problem_id = 1;

-- UPDATE: 문제 비활성화
UPDATE problems 
SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP
WHERE problem_id = 1;

-- DELETE: 문제 삭제
DELETE FROM problems WHERE problem_id = 1;

-- =====================================================
-- 4. SUBMISSIONS 테이블 CRUD
-- =====================================================

-- CREATE: 문제 제출
INSERT INTO submissions (user_id, problem_id, submitted_code, result, score, execution_time_ms, memory_usage_kb)
VALUES (1, 1, 'print("Hello World")', 'correct', 100, 50, 1024);

-- CREATE: 오답 제출
INSERT INTO submissions (user_id, problem_id, submitted_code, result, score, error_message)
VALUES (1, 2, 'print("Hello")', 'incorrect', 0, 'Expected output does not match');

-- READ: 사용자의 제출 기록 조회
SELECT submission_id, problem_id, submitted_code, result, score, 
       execution_time_ms, memory_usage_kb, submitted_at
FROM submissions 
WHERE user_id = 1
ORDER BY submitted_at DESC
LIMIT 10;

-- READ: 특정 문제의 제출 기록
SELECT s.submission_id, s.user_id, u.username, s.result, s.score, s.submitted_at
FROM submissions s
JOIN users u ON s.user_id = u.user_id
WHERE s.problem_id = 1
ORDER BY s.submitted_at DESC;

-- READ: 사용자의 특정 문제 최고 점수
SELECT MAX(score) as best_score, MIN(submitted_at) as first_attempt
FROM submissions 
WHERE user_id = 1 AND problem_id = 1 AND result = 'correct';

-- UPDATE: 제출 결과 업데이트 (재채점 등)
UPDATE submissions 
SET result = 'correct', score = 85
WHERE submission_id = 1;

-- DELETE: 제출 기록 삭제
DELETE FROM submissions WHERE submission_id = 1;

-- =====================================================
-- 5. ATTENDANCE 테이블 CRUD
-- =====================================================

-- CREATE: 출석 기록
INSERT INTO attendance (user_id, attendance_date, is_present, problems_solved, time_spent_minutes, streak_count)
VALUES (1, CURDATE(), TRUE, 3, 120, 5);

-- CREATE: 결석 기록
INSERT INTO attendance (user_id, attendance_date, is_present, problems_solved, time_spent_minutes, streak_count)
VALUES (1, '2024-01-01', FALSE, 0, 0, 0);

-- READ: 사용자 출석 현황 조회
SELECT attendance_date, is_present, problems_solved, time_spent_minutes, streak_count
FROM attendance 
WHERE user_id = 1 AND attendance_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
ORDER BY attendance_date DESC;

-- READ: 출석률 계산
SELECT 
    COUNT(*) as total_days,
    COUNT(CASE WHEN is_present = TRUE THEN 1 END) as present_days,
    ROUND(COUNT(CASE WHEN is_present = TRUE THEN 1 END) * 100.0 / COUNT(*), 2) as attendance_rate
FROM attendance 
WHERE user_id = 1 AND attendance_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY);

-- READ: 연속 출석일 조회
SELECT MAX(streak_count) as max_streak, 
       streak_count as current_streak
FROM attendance 
WHERE user_id = 1
ORDER BY attendance_date DESC 
LIMIT 1;

-- UPDATE: 출석 정보 수정
UPDATE attendance 
SET problems_solved = 5, time_spent_minutes = 180, streak_count = 6
WHERE user_id = 1 AND attendance_date = CURDATE();

-- DELETE: 출석 기록 삭제
DELETE FROM attendance 
WHERE user_id = 1 AND attendance_date = '2024-01-01';

-- =====================================================
-- 6. LEAGUES 테이블 CRUD
-- =====================================================

-- CREATE: 새 리그 생성
INSERT INTO leagues (season, league_name, description, start_date, end_date, status, max_participants)
VALUES ('2024-W01', '2024년 1주차 리그', '새해 첫 주 리그전', '2024-01-01', '2024-01-07', 'upcoming', 100);

-- READ: 활성 리그 조회
SELECT league_id, season, league_name, description, start_date, end_date, status, max_participants
FROM leagues 
WHERE status = 'active'
ORDER BY start_date DESC;

-- READ: 특정 시즌 리그 조회
SELECT league_id, league_name, start_date, end_date, status
FROM leagues 
WHERE season LIKE '2024%'
ORDER BY start_date;

-- UPDATE: 리그 상태 변경
UPDATE leagues 
SET status = 'active', updated_at = CURRENT_TIMESTAMP
WHERE league_id = 1;

-- UPDATE: 리그 정보 수정
UPDATE leagues 
SET league_name = '수정된 리그명', 
    description = '수정된 설명',
    updated_at = CURRENT_TIMESTAMP
WHERE league_id = 1;

-- DELETE: 리그 삭제
DELETE FROM leagues WHERE league_id = 1;

-- =====================================================
-- 7. USER_LEAGUE_PARTICIPATION 테이블 CRUD
-- =====================================================

-- CREATE: 리그 참여
INSERT INTO user_league_participation (user_id, league_id, score, problems_solved)
VALUES (1, 1, 0, 0);

-- READ: 리그 참여자 목록 및 순위
SELECT ulp.user_id, u.username, ulp.score, ulp.rank_position, ulp.problems_solved, ulp.time_spent_minutes
FROM user_league_participation ulp
JOIN users u ON ulp.user_id = u.user_id
WHERE ulp.league_id = 1
ORDER BY ulp.score DESC, ulp.time_spent_minutes ASC;

-- READ: 사용자의 리그 참여 기록
SELECT l.season, l.league_name, ulp.score, ulp.rank_position, ulp.problems_solved
FROM user_league_participation ulp
JOIN leagues l ON ulp.league_id = l.league_id
WHERE ulp.user_id = 1
ORDER BY l.start_date DESC;

-- UPDATE: 리그 점수 및 순위 업데이트
UPDATE user_league_participation 
SET score = 150, 
    rank_position = 3, 
    problems_solved = 5,
    time_spent_minutes = 300,
    last_activity = CURRENT_TIMESTAMP
WHERE user_id = 1 AND league_id = 1;

-- DELETE: 리그 참여 취소
DELETE FROM user_league_participation 
WHERE user_id = 1 AND league_id = 1;

-- =====================================================
-- 8. PROBLEM_EVALUATIONS 테이블 CRUD
-- =====================================================

-- CREATE: 문제 평가
INSERT INTO problem_evaluations (user_id, problem_id, rating, feedback)
VALUES (1, 1, 4, '좋은 문제였습니다. 설명이 명확해요.');

-- CREATE: 문제 신고
INSERT INTO problem_evaluations (user_id, problem_id, rating, feedback, is_reported, report_reason)
VALUES (1, 2, 1, '문제에 오류가 있습니다.', TRUE, '정답이 틀렸습니다.');

-- READ: 문제별 평가 조회
SELECT pe.evaluation_id, u.username, pe.rating, pe.feedback, pe.is_reported, pe.created_at
FROM problem_evaluations pe
JOIN users u ON pe.user_id = u.user_id
WHERE pe.problem_id = 1
ORDER BY pe.created_at DESC;

-- READ: 신고된 문제들 조회
SELECT pe.evaluation_id, pe.problem_id, p.title, u.username, pe.report_reason, pe.created_at
FROM problem_evaluations pe
JOIN problems p ON pe.problem_id = p.problem_id
JOIN users u ON pe.user_id = u.user_id
WHERE pe.is_reported = TRUE
ORDER BY pe.created_at DESC;

-- READ: 문제 평균 평점 조회
SELECT 
    problem_id,
    COUNT(*) as total_evaluations,
    AVG(rating) as avg_rating,
    COUNT(CASE WHEN is_reported = TRUE THEN 1 END) as report_count
FROM problem_evaluations 
WHERE problem_id = 1;

-- UPDATE: 평가 수정
UPDATE problem_evaluations 
SET rating = 5, feedback = '정말 좋은 문제입니다!'
WHERE user_id = 1 AND problem_id = 1;

-- DELETE: 평가 삭제
DELETE FROM problem_evaluations 
WHERE user_id = 1 AND problem_id = 1;

-- =====================================================
-- 9. PAYMENTS 테이블 CRUD
-- =====================================================

-- CREATE: 결제 생성
INSERT INTO payments (user_id, amount, currency, payment_method, status, external_payment_id, 
                      payment_gateway, billing_period_start, billing_period_end)
VALUES (1, 29900.00, 'KRW', 'card', 'pending', 'toss_payment_123', 'toss', '2024-01-01', '2024-01-31');

-- READ: 사용자 결제 기록 조회
SELECT payment_id, amount, currency, payment_method, status, 
       billing_period_start, billing_period_end, created_at
FROM payments 
WHERE user_id = 1
ORDER BY created_at DESC;

-- READ: 특정 기간 결제 현황
SELECT 
    COUNT(*) as total_payments,
    SUM(amount) as total_amount,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_payments,
    COUNT(CASE WHEN status = 'refunded' THEN 1 END) as refunded_payments
FROM payments 
WHERE created_at >= '2024-01-01' AND created_at < '2024-02-01';

-- UPDATE: 결제 완료 처리
UPDATE payments 
SET status = 'completed', updated_at = CURRENT_TIMESTAMP
WHERE payment_id = 1;

-- UPDATE: 환급 처리
UPDATE payments 
SET status = 'refunded', 
    refund_amount = 29900.00,
    refund_reason = '출석률 80% 이상 달성',
    refund_processed_at = CURRENT_TIMESTAMP,
    updated_at = CURRENT_TIMESTAMP
WHERE payment_id = 1;

-- DELETE: 결제 기록 삭제 (주의 - 보통 하지 않음)
DELETE FROM payments WHERE payment_id = 1;

-- =====================================================
-- 10. STATISTICS 테이블 CRUD
-- =====================================================

-- CREATE: 일간 통계 생성
INSERT INTO statistics (user_id, period_type, period_start, period_end, 
                        problems_solved, problems_attempted, correct_submissions, 
                        total_submissions, time_spent_minutes, streak_days, detailed_stats)
VALUES (1, 'daily', CURDATE(), CURDATE(), 5, 8, 5, 12, 180, 3, 
        '{"categories": {"loops": 2, "conditionals": 3}, "difficulty": {"beginner": 4, "intermediate": 1}}');

-- READ: 사용자 최근 통계 조회
SELECT period_type, period_start, period_end, problems_solved, problems_attempted,
       ROUND(correct_submissions * 100.0 / total_submissions, 2) as success_rate,
       time_spent_minutes, streak_days
FROM statistics 
WHERE user_id = 1 AND period_start >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
ORDER BY period_start DESC;

-- READ: 월간 통계 조회
SELECT 
    SUM(problems_solved) as total_problems_solved,
    SUM(time_spent_minutes) as total_time_spent,
    AVG(correct_submissions * 100.0 / total_submissions) as avg_success_rate,
    MAX(streak_days) as max_streak
FROM statistics 
WHERE user_id = 1 AND period_type = 'daily' 
  AND period_start >= DATE_SUB(CURDATE(), INTERVAL 30 DAY);

-- UPDATE: 통계 데이터 수정
UPDATE statistics 
SET problems_solved = 6, 
    time_spent_minutes = 200,
    detailed_stats = '{"categories": {"loops": 3, "conditionals": 3}}',
    updated_at = CURRENT_TIMESTAMP
WHERE user_id = 1 AND period_start = CURDATE();

-- DELETE: 통계 데이터 삭제
DELETE FROM statistics 
WHERE user_id = 1 AND period_start = '2024-01-01';

-- =====================================================
-- 복합 쿼리 (조인, 집계 등)
-- =====================================================

-- 사용자별 학습 현황 대시보드
SELECT 
    u.user_id,
    u.username,
    u.current_level,
    u.experience_points,
    COUNT(DISTINCT s.problem_id) as unique_problems_solved,
    COUNT(s.submission_id) as total_submissions,
    ROUND(COUNT(CASE WHEN s.result = 'correct' THEN 1 END) * 100.0 / COUNT(s.submission_id), 2) as success_rate,
    MAX(a.streak_count) as max_streak,
    COUNT(DISTINCT DATE(a.attendance_date)) as total_attendance_days
FROM users u
LEFT JOIN submissions s ON u.user_id = s.user_id
LEFT JOIN attendance a ON u.user_id = a.user_id AND a.is_present = TRUE
WHERE u.user_id = 1
GROUP BY u.user_id, u.username, u.current_level, u.experience_points;

-- 문제별 난이도 및 성공률 분석
SELECT 
    p.level,
    p.category,
    p.difficulty,
    COUNT(DISTINCT p.problem_id) as total_problems,
    COUNT(DISTINCT s.submission_id) as total_attempts,
    COUNT(DISTINCT CASE WHEN s.result = 'correct' THEN s.submission_id END) as successful_attempts,
    ROUND(COUNT(CASE WHEN s.result = 'correct' THEN 1 END) * 100.0 / COUNT(s.submission_id), 2) as success_rate,
    AVG(pe.rating) as avg_rating
FROM problems p
LEFT JOIN submissions s ON p.problem_id = s.problem_id
LEFT JOIN problem_evaluations pe ON p.problem_id = pe.problem_id
WHERE p.is_active = TRUE
GROUP BY p.level, p.category, p.difficulty
ORDER BY p.level, p.category;

-- 리그전 실시간 랭킹
SELECT 
    u.username,
    ulp.score,
    ulp.problems_solved,
    ulp.time_spent_minutes,
    ROW_NUMBER() OVER (ORDER BY ulp.score DESC, ulp.time_spent_minutes ASC) as current_rank
FROM user_league_participation ulp
JOIN users u ON ulp.user_id = u.user_id
JOIN leagues l ON ulp.league_id = l.league_id
WHERE l.status = 'active'
ORDER BY ulp.score DESC, ulp.time_spent_minutes ASC;

-- 학습 패턴 분석 (최근 30일)
SELECT 
    u.username,
    COUNT(DISTINCT DATE(s.submitted_at)) as active_days,
    COUNT(s.submission_id) as total_submissions,
    COUNT(DISTINCT s.problem_id) as unique_problems,
    AVG(s.score) as avg_score,
    SUM(CASE WHEN HOUR(s.submitted_at) BETWEEN 9 AND 17 THEN 1 ELSE 0 END) as daytime_submissions,
    SUM(CASE WHEN HOUR(s.submitted_at) BETWEEN 18 AND 23 THEN 1 ELSE 0 END) as evening_submissions
FROM users u
JOIN submissions s ON u.user_id = s.user_id
WHERE s.submitted_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
GROUP BY u.user_id, u.username
ORDER BY total_submissions DESC;

-- 환급 대상자 조회 (출석률 80% 이상)
SELECT 
    u.user_id,
    u.username,
    p.payment_id,
    p.amount,
    p.billing_period_start,
    p.billing_period_end,
    COUNT(a.attendance_date) as total_days,
    COUNT(CASE WHEN a.is_present = TRUE THEN 1 END) as present_days,
    ROUND(COUNT(CASE WHEN a.is_present = TRUE THEN 1 END) * 100.0 / COUNT(a.attendance_date), 2) as attendance_rate
FROM users u
JOIN payments p ON u.user_id = p.user_id
LEFT JOIN attendance a ON u.user_id = a.user_id 
    AND a.attendance_date BETWEEN p.billing_period_start AND p.billing_period_end
WHERE p.status = 'completed' AND p.refund_amount = 0
GROUP BY u.user_id, u.username, p.payment_id, p.amount, p.billing_period_start, p.billing_period_end
HAVING attendance_rate >= 80
ORDER BY attendance_rate DESC;

-- =====================================================
-- 성능 최적화 쿼리 예시
-- =====================================================

-- 사용자별 최근 활동 (인덱스 활용)
SELECT s.submitted_at, p.title, s.result, s.score
FROM submissions s
JOIN problems p ON s.problem_id = p.problem_id
WHERE s.user_id = 1 
  AND s.submitted_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
ORDER BY s.submitted_at DESC
LIMIT 10;

-- 레벨별 추천 문제 (복합 인덱스 활용)
SELECT p.problem_id, p.title, p.difficulty, p.rating, p.estimated_time_minutes
FROM problems p
WHERE p.level = 2 AND p.is_active = TRUE
ORDER BY p.rating DESC, p.rating_count DESC
LIMIT 5; 