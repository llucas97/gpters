-- study_sessions 테이블에 채점 관련 필드 추가
-- 문제 유형, 채점 결과, 시도 정보 등을 저장할 수 있도록 확장

-- 문제 유형 필드 추가
ALTER TABLE study_sessions 
ADD COLUMN problem_type ENUM('block', 'cloze', 'code_editor', 'ordering', 'bug_fix') 
NOT NULL DEFAULT 'cloze' 
COMMENT '문제 유형: 블록코딩, 빈칸채우기, 코드에디터, 순서배열, 버그수정';

-- 문제 제목과 설명 필드 추가
ALTER TABLE study_sessions 
ADD COLUMN problem_title VARCHAR(255) NULL 
COMMENT '문제 제목';

ALTER TABLE study_sessions 
ADD COLUMN problem_description TEXT NULL 
COMMENT '문제 설명';

-- 채점 결과 필드들 추가
ALTER TABLE study_sessions 
ADD COLUMN score INT NULL 
COMMENT '채점 점수 (0-100)';

ALTER TABLE study_sessions 
ADD COLUMN is_correct BOOLEAN NULL 
COMMENT '전체 문제 정답 여부';

ALTER TABLE study_sessions 
ADD COLUMN user_answer JSON NULL 
COMMENT '사용자 답안 데이터';

ALTER TABLE study_sessions 
ADD COLUMN grading_result JSON NULL 
COMMENT '상세 채점 결과';

ALTER TABLE study_sessions 
ADD COLUMN feedback TEXT NULL 
COMMENT '채점 피드백 메시지';

-- 시도 관련 필드 추가
ALTER TABLE study_sessions 
ADD COLUMN attempt_count INT NOT NULL DEFAULT 1 
COMMENT '같은 문제에 대한 시도 횟수';

ALTER TABLE study_sessions 
ADD COLUMN is_first_attempt BOOLEAN NOT NULL DEFAULT TRUE 
COMMENT '첫 번째 시도 여부';

-- 인덱스 추가 (성능 최적화)
CREATE INDEX idx_study_sessions_problem_type ON study_sessions(problem_type);
CREATE INDEX idx_study_sessions_is_correct ON study_sessions(is_correct);
CREATE INDEX idx_study_sessions_user_problem ON study_sessions(user_id, problem_id);
CREATE INDEX idx_study_sessions_user_level ON study_sessions(user_id, level);
CREATE INDEX idx_study_sessions_user_type ON study_sessions(user_id, problem_type);

-- 기존 데이터에 대한 기본값 설정
UPDATE study_sessions 
SET problem_type = 'cloze' 
WHERE problem_type IS NULL;

-- 점수 필드에 제약 조건 추가
ALTER TABLE study_sessions 
ADD CONSTRAINT chk_score_range 
CHECK (score IS NULL OR (score >= 0 AND score <= 100));

-- 시도 횟수 필드에 제약 조건 추가
ALTER TABLE study_sessions 
ADD CONSTRAINT chk_attempt_count_positive 
CHECK (attempt_count > 0);
