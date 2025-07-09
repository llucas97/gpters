-- =====================================================
-- Gpters 플랫폼 기본 CRUD 쿼리 예시
-- PostgreSQL + Redis 연동 고려
-- =====================================================

-- =====================================================
-- 1. USERS 테이블 CRUD
-- =====================================================

-- CREATE: 새 사용자 생성 (소셜 로그인)
INSERT INTO users (email, username, full_name, provider, provider_id, current_level, experience_points)
VALUES ('user@gmail.com', 'coder123', '김개발', 'google', 'google_12345', 0, 0)
RETURNING user_id, email, username, current_level, created_at;

-- CREATE: 로컬 회원가입
INSERT INTO users (email, username, full_name, password_hash, provider)
VALUES ('local@example.com', 'localuser', '로컬유저', '$2b$10$hashedpassword', 'local')
RETURNING user_id, email, username;

-- READ: 사용자 정보 조회 (로그인)
SELECT user_id, email, username, full_name, current_level, experience_points, 
       total_experience, is_active, last_login
FROM users 
WHERE email = 'user@gmail.com' AND is_active = true;

-- READ: 사용자 상세 정보 (프로필)
SELECT u.user_id, u.username, u.full_name, u.current_level, u.experience_points,
       u.total_experience, u.created_at, u.last_login,
       s.job, s.purpose, s.motivation
FROM users u
LEFT JOIN surveys s ON u.user_id = s.user_id
WHERE u.user_id = 123;

-- READ: 레벨별 사용자 순위 (리더보드)
SELECT user_id, username, current_level, total_experience,
       RANK() OVER (ORDER BY total_experience DESC) as rank
FROM users 
WHERE is_active = true
ORDER BY total_experience DESC
LIMIT 100;

-- UPDATE: 경험치 및 레벨 업데이트
UPDATE users 
SET experience_points = experience_points + 50,
    total_experience = total_experience + 50,
    current_level = CASE 
        WHEN total_experience + 50 >= 45000 THEN 5
        WHEN total_experience + 50 >= 23000 THEN 4  
        WHEN total_experience + 50 >= 11000 THEN 3
        WHEN total_experience + 50 >= 5000 THEN 2
        WHEN total_experience + 50 >= 2000 THEN 1
        ELSE 0
    END,
    updated_at = CURRENT_TIMESTAMP
WHERE user_id = 123
RETURNING user_id, current_level, experience_points, total_experience;

-- UPDATE: 마지막 로그인 시간 갱신
UPDATE users 
SET last_login = CURRENT_TIMESTAMP 
WHERE user_id = 123;

-- DELETE: 사용자 비활성화 (소프트 삭제)
UPDATE users 
SET is_active = false, updated_at = CURRENT_TIMESTAMP 
WHERE user_id = 123;

-- =====================================================
-- 2. PROBLEMS 테이블 CRUD
-- =====================================================

-- CREATE: 새 문제 생성
INSERT INTO problems (title, description, content, level, category, difficulty, 
                     problem_type, test_cases, solution, hints, is_leveltest)
VALUES (
    '반복문 기초',
    '1부터 10까지 숫자를 출력하는 프로그램을 작성하세요',
    '<p>for문을 사용해서 1부터 10까지 숫자를 출력하세요.</p>',
    1,
    'loops',
    'easy',
    'fill_blank',
    '[
        {"input": "", "expected_output": "1\n2\n3\n4\n5\n6\n7\n8\n9\n10"}
    ]',
    '{
        "code": "for i in range(1, 11):\n    print(i)",
        "explanation": "range(1, 11)는 1부터 10까지의 숫자를 생성합니다."
    }',
    '["range() 함수를 사용해보세요", "1부터 시작해서 11까지(포함하지 않음)"]',
    false
)
RETURNING problem_id, title, level, category;

-- READ: 레벨별 문제 목록 조회
SELECT problem_id, title, description, level, category, difficulty, 
       rating, rating_count, created_at
FROM problems 
WHERE level = 2 AND is_active = true
ORDER BY rating DESC, created_at DESC
LIMIT 20;

-- READ: 문제 상세 정보 (풀이용)
SELECT problem_id, title, description, content, level, category, difficulty,
       test_cases, hints, rating, rating_count
FROM problems 
WHERE problem_id = 123 AND is_active = true;

-- READ: 레벨테스트 문제 조회
SELECT problem_id, title, description, content, level, test_cases
FROM problems 
WHERE is_leveltest = true AND level = 2 AND is_active = true
ORDER BY RANDOM()
LIMIT 5;

-- READ: 문제 통계 (관리자용)
SELECT 
    p.problem_id,
    p.title,
    p.level,
    p.rating,
    COUNT(s.submission_id) as total_submissions,
    COUNT(CASE WHEN s.result = 'correct' THEN 1 END) as correct_submissions,
    ROUND(COUNT(CASE WHEN s.result = 'correct' THEN 1 END) * 100.0 / 
          NULLIF(COUNT(s.submission_id), 0), 2) as success_rate
FROM problems p
LEFT JOIN submissions s ON p.problem_id = s.problem_id
WHERE p.is_active = true
GROUP BY p.problem_id, p.title, p.level, p.rating
ORDER BY success_rate ASC;

-- UPDATE: 문제 평점 업데이트
UPDATE problems 
SET rating = (
    SELECT AVG(CASE 
        WHEN pe.rating = 'boom_up' THEN 5.0
        WHEN pe.rating = 'boom_down' THEN 1.0
    END)
    FROM problem_evaluations pe 
    WHERE pe.problem_id = problems.problem_id
),
rating_count = (
    SELECT COUNT(*)
    FROM problem_evaluations pe 
    WHERE pe.problem_id = problems.problem_id
),
updated_at = CURRENT_TIMESTAMP
WHERE problem_id = 123;

-- DELETE: 문제 비활성화
UPDATE problems 
SET is_active = false, updated_at = CURRENT_TIMESTAMP 
WHERE problem_id = 123;

-- =====================================================
-- 3. SUBMISSIONS 테이블 CRUD
-- =====================================================

-- CREATE: 문제 제출 기록
INSERT INTO submissions (user_id, problem_id, user_code, result, score, 
                        time_taken, execution_details, feedback)
VALUES (
    123,
    45,
    'for i in range(1, 11):\n    print(i)',
    'correct',
    95,
    180,
    '{
        "test_results": [
            {"case": 1, "status": "passed", "time": 0.001},
            {"case": 2, "status": "passed", "time": 0.002}
        ],
        "total_time": 0.003
    }',
    'Great job! Your solution is efficient and correct.'
)
RETURNING submission_id, result, score, submitted_at;

-- READ: 사용자의 제출 기록
SELECT s.submission_id, s.problem_id, p.title, s.result, s.score, 
       s.time_taken, s.submitted_at
FROM submissions s
JOIN problems p ON s.problem_id = p.problem_id
WHERE s.user_id = 123
ORDER BY s.submitted_at DESC
LIMIT 50;

-- READ: 특정 문제에 대한 사용자의 최고 점수
SELECT MAX(score) as best_score, 
       MIN(time_taken) as best_time,
       COUNT(*) as attempt_count
FROM submissions 
WHERE user_id = 123 AND problem_id = 45;

-- READ: 사용자별 정확도 통계
SELECT 
    user_id,
    COUNT(*) as total_submissions,
    COUNT(CASE WHEN result = 'correct' THEN 1 END) as correct_submissions,
    ROUND(COUNT(CASE WHEN result = 'correct' THEN 1 END) * 100.0 / COUNT(*), 2) as accuracy_rate,
    AVG(score) as average_score
FROM submissions 
WHERE user_id = 123
GROUP BY user_id;

-- READ: 일일 제출 통계 (출석체크용)
SELECT 
    DATE(submitted_at) as submission_date,
    COUNT(DISTINCT problem_id) as problems_attempted,
    COUNT(CASE WHEN result = 'correct' THEN 1 END) as problems_solved
FROM submissions 
WHERE user_id = 123 
  AND submitted_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(submitted_at)
ORDER BY submission_date DESC;

-- UPDATE: 제출 결과 수정 (재채점)
UPDATE submissions 
SET result = 'correct',
    score = 100,
    feedback = 'Updated after review',
    execution_details = execution_details || '{"updated": true}'
WHERE submission_id = 12345;

-- =====================================================
-- 4. ATTENDANCE 테이블 CRUD
-- =====================================================

-- CREATE/UPDATE: 출석 기록 (UPSERT)
INSERT INTO attendance (user_id, attendance_date, is_present, problems_solved, 
                       first_activity, last_activity)
VALUES (123, CURRENT_DATE, true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (user_id, attendance_date)
DO UPDATE SET 
    is_present = true,
    problems_solved = attendance.problems_solved + 1,
    last_activity = CURRENT_TIMESTAMP;

-- READ: 사용자의 최근 출석 기록
SELECT attendance_date, is_present, problems_solved
FROM attendance 
WHERE user_id = 123 
  AND attendance_date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY attendance_date DESC;

-- READ: 연속 출석일 계산
WITH consecutive_days AS (
    SELECT attendance_date,
           attendance_date - INTERVAL '1 day' * ROW_NUMBER() OVER (ORDER BY attendance_date DESC) as group_date
    FROM attendance 
    WHERE user_id = 123 AND is_present = true
    ORDER BY attendance_date DESC
)
SELECT COUNT(*) as consecutive_attendance_days
FROM consecutive_days 
WHERE group_date = (SELECT group_date FROM consecutive_days LIMIT 1);

-- READ: 월별 출석률
SELECT 
    DATE_TRUNC('month', attendance_date) as month,
    COUNT(*) as attendance_days,
    COUNT(CASE WHEN is_present THEN 1 END) as present_days,
    ROUND(COUNT(CASE WHEN is_present THEN 1 END) * 100.0 / COUNT(*), 2) as attendance_rate
FROM attendance 
WHERE user_id = 123
GROUP BY DATE_TRUNC('month', attendance_date)
ORDER BY month DESC;

-- =====================================================
-- 5. LEAGUES & PARTICIPATION 테이블 CRUD
-- =====================================================

-- CREATE: 새 리그 생성
INSERT INTO leagues (name, season, start_date, end_date, status, rules)
VALUES (
    '7월 2주차 챌린지',
    '2024-07-W2',
    '2024-07-08',
    '2024-07-14',
    'upcoming',
    '{
        "max_participants": 1000,
        "problems_per_day": 3,
        "bonus_points": {"streak": 10, "perfect_score": 20}
    }'
)
RETURNING league_id, name, season;

-- CREATE: 리그 참여
INSERT INTO user_league_participation (user_id, league_id, score)
VALUES (123, 456, 0)
ON CONFLICT (user_id, league_id) DO NOTHING
RETURNING participation_id;

-- READ: 활성 리그 목록
SELECT league_id, name, season, start_date, end_date, status,
       (rules->>'max_participants')::int as max_participants
FROM leagues 
WHERE status = 'active'
ORDER BY start_date DESC;

-- READ: 리그 랭킹 조회
SELECT 
    u.user_id,
    u.username,
    ulp.score,
    ulp.rank,
    ROW_NUMBER() OVER (ORDER BY ulp.score DESC) as current_rank
FROM user_league_participation ulp
JOIN users u ON ulp.user_id = u.user_id
WHERE ulp.league_id = 456
ORDER BY ulp.score DESC
LIMIT 100;

-- UPDATE: 리그 점수 업데이트
UPDATE user_league_participation 
SET score = score + 50,
    last_activity = CURRENT_TIMESTAMP
WHERE user_id = 123 AND league_id = 456
RETURNING score;

-- UPDATE: 리그 순위 계산 (배치 작업)
WITH ranked_participants AS (
    SELECT participation_id,
           ROW_NUMBER() OVER (ORDER BY score DESC) as new_rank
    FROM user_league_participation 
    WHERE league_id = 456
)
UPDATE user_league_participation ulp
SET rank = rp.new_rank
FROM ranked_participants rp
WHERE ulp.participation_id = rp.participation_id;

-- =====================================================
-- 6. STATISTICS 테이블 CRUD
-- =====================================================

-- CREATE: 일일 통계 생성
INSERT INTO statistics (user_id, period_type, period_start, period_end,
                       problems_solved, total_time_spent, accuracy_rate,
                       level_progress, weak_areas, strength_areas)
SELECT 
    s.user_id,
    'daily',
    CURRENT_DATE,
    CURRENT_DATE,
    COUNT(CASE WHEN s.result = 'correct' THEN 1 END),
    COALESCE(SUM(s.time_taken), 0),
    ROUND(COUNT(CASE WHEN s.result = 'correct' THEN 1 END) * 100.0 / 
          NULLIF(COUNT(*), 0), 2),
    json_build_object('current_level', u.current_level, 'progress', u.experience_points),
    '[]'::jsonb,
    '[]'::jsonb
FROM submissions s
JOIN users u ON s.user_id = u.user_id
WHERE s.user_id = 123 
  AND DATE(s.submitted_at) = CURRENT_DATE
GROUP BY s.user_id, u.current_level, u.experience_points
ON CONFLICT (user_id, period_type, period_start, period_end) 
DO UPDATE SET 
    problems_solved = EXCLUDED.problems_solved,
    total_time_spent = EXCLUDED.total_time_spent,
    accuracy_rate = EXCLUDED.accuracy_rate,
    calculated_at = CURRENT_TIMESTAMP;

-- READ: 사용자 통계 조회
SELECT period_type, period_start, period_end, problems_solved,
       total_time_spent, accuracy_rate, level_progress
FROM statistics 
WHERE user_id = 123 
  AND period_type = 'weekly'
ORDER BY period_start DESC
LIMIT 12;

-- =====================================================
-- 7. 복합 쿼리 (비즈니스 로직)
-- =====================================================

-- 사용자 대시보드 종합 정보
WITH user_stats AS (
    SELECT 
        COUNT(*) as total_submissions,
        COUNT(CASE WHEN result = 'correct' THEN 1 END) as correct_submissions,
        AVG(score) as avg_score
    FROM submissions 
    WHERE user_id = 123
),
recent_activity AS (
    SELECT COUNT(DISTINCT DATE(submitted_at)) as active_days
    FROM submissions 
    WHERE user_id = 123 
      AND submitted_at >= CURRENT_DATE - INTERVAL '7 days'
),
current_streak AS (
    SELECT COUNT(*) as streak_days
    FROM attendance 
    WHERE user_id = 123 
      AND is_present = true 
      AND attendance_date >= CURRENT_DATE - INTERVAL '30 days'
)
SELECT 
    u.username,
    u.current_level,
    u.experience_points,
    u.total_experience,
    us.total_submissions,
    us.correct_submissions,
    ROUND(us.avg_score, 2) as average_score,
    ra.active_days as recent_active_days,
    cs.streak_days as attendance_streak
FROM users u
CROSS JOIN user_stats us
CROSS JOIN recent_activity ra  
CROSS JOIN current_streak cs
WHERE u.user_id = 123;

-- 레벨테스트 결과 분석
WITH test_results AS (
    SELECT 
        p.level,
        AVG(s.score) as avg_score,
        COUNT(*) as attempts
    FROM submissions s
    JOIN problems p ON s.problem_id = p.problem_id
    WHERE s.user_id = 123 
      AND p.is_leveltest = true
    GROUP BY p.level
)
SELECT 
    level,
    avg_score,
    attempts,
    CASE 
        WHEN avg_score >= 80 THEN 'passed'
        WHEN avg_score >= 60 THEN 'borderline'
        ELSE 'failed'
    END as status
FROM test_results
ORDER BY level;

-- 추천 문제 목록 (개인화)
WITH user_weak_categories AS (
    SELECT p.category, AVG(s.score) as avg_score
    FROM submissions s
    JOIN problems p ON s.problem_id = p.problem_id
    WHERE s.user_id = 123
    GROUP BY p.category
    HAVING AVG(s.score) < 70
),
solved_problems AS (
    SELECT DISTINCT problem_id 
    FROM submissions 
    WHERE user_id = 123 AND result = 'correct'
)
SELECT DISTINCT p.problem_id, p.title, p.difficulty, p.rating
FROM problems p
JOIN user_weak_categories uwc ON p.category = uwc.category
WHERE p.level = (SELECT current_level FROM users WHERE user_id = 123)
  AND p.is_active = true
  AND p.problem_id NOT IN (SELECT problem_id FROM solved_problems)
ORDER BY p.rating DESC, RANDOM()
LIMIT 10;

-- =====================================================
-- 8. 성능 최적화를 위한 인덱스 힌트 쿼리
-- =====================================================

-- 사용자별 최근 활동 (인덱스 활용)
SELECT /*+ INDEX(submissions idx_submissions_user_id) */ 
    problem_id, result, score, submitted_at
FROM submissions 
WHERE user_id = 123 
ORDER BY submitted_at DESC 
LIMIT 20;

-- 레벨별 인기 문제 (인덱스 활용)
SELECT /*+ INDEX(problems idx_problems_level_active) */
    problem_id, title, rating, rating_count
FROM problems 
WHERE level = 2 AND is_active = true
ORDER BY rating DESC, rating_count DESC
LIMIT 10;

-- =====================================================
-- 완료
-- =====================================================
-- 이 CRUD 쿼리들은 Gpters 플랫폼의 핵심 기능을 모두 지원합니다:
-- 1. 사용자 관리 (회원가입, 로그인, 레벨링)
-- 2. 문제 관리 (CRUD, 통계, 추천)
-- 3. 제출 관리 (채점, 기록, 분석)
-- 4. 출석 관리 (기록, 연속일 계산)
-- 5. 리그전 관리 (참여, 랭킹, 점수)
-- 6. 통계 관리 (일간/주간/월간 통계)
-- 7. 복합 비즈니스 로직 (대시보드, 추천)
-- 8. 성능 최적화 (인덱스 활용) 