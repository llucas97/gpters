-- 기존 user_experience 테이블 컬럼 확인
DESCRIBE user_experience;

-- userId 컬럼이 있으면 user_id로 변경
ALTER TABLE user_experience 
  CHANGE COLUMN userId user_id INT NOT NULL;

-- 또는 userId 컬럼을 삭제하고 user_id 추가
-- ALTER TABLE user_experience DROP COLUMN userId;
-- ALTER TABLE user_experience ADD COLUMN user_id INT NOT NULL AFTER id;

-- Foreign Key 추가 (없을 경우)
ALTER TABLE user_experience 
  ADD CONSTRAINT fk_user_experience_user 
  FOREIGN KEY (user_id) REFERENCES users(user_id) 
  ON DELETE CASCADE;

-- 인덱스 추가 (없을 경우)
ALTER TABLE user_experience ADD INDEX idx_user_id (user_id);
ALTER TABLE user_experience ADD INDEX idx_level (level);
ALTER TABLE user_experience ADD INDEX idx_totalExperience (totalExperience);
ALTER TABLE user_experience ADD INDEX idx_user_level (user_id, level);

-- 확인
SHOW CREATE TABLE user_experience;
SELECT * FROM user_experience LIMIT 5;

