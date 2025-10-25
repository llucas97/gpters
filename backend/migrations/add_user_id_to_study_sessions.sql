-- study_sessions 테이블에 user_id 컬럼 추가
ALTER TABLE study_sessions 
ADD COLUMN user_id VARCHAR(128) NULL 
AFTER id;

-- 기존 데이터에 대한 인덱스 추가 (성능 최적화)
CREATE INDEX idx_study_sessions_user_id ON study_sessions(user_id);
CREATE INDEX idx_study_sessions_client_id ON study_sessions(client_id);

-- 기존 handle 기본값 'anonymous'로 설정된 레코드들을 위한 체크
UPDATE study_sessions 
SET handle = 'anonymous' 
WHERE handle IS NULL OR handle = '';









