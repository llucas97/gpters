-- 1. 기존 user_experience 테이블 확인
SHOW TABLES LIKE 'user_experience';

-- 2. 기존 테이블이 있다면 삭제 (주의: 데이터가 삭제됩니다!)
-- DROP TABLE IF EXISTS user_experience;

-- 3. user_experience 테이블 생성
CREATE TABLE IF NOT EXISTS user_experience (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  totalExperience INT NOT NULL DEFAULT 0 COMMENT '총 경험치',
  level INT NOT NULL DEFAULT 1 COMMENT '현재 레벨',
  currentLevelExp INT NOT NULL DEFAULT 0 COMMENT '현재 레벨에서의 경험치',
  expToNextLevel INT NOT NULL DEFAULT 100 COMMENT '다음 레벨까지 필요한 경험치',
  progressPercentage INT NOT NULL DEFAULT 0 COMMENT '현재 레벨 진행률 (%)',
  lastLevelUpAt DATETIME NULL COMMENT '마지막 레벨업 시간',
  totalLevelUps INT NOT NULL DEFAULT 0 COMMENT '총 레벨업 횟수',
  highestLevel INT NOT NULL DEFAULT 1 COMMENT '최고 레벨',
  experienceHistory JSON NULL COMMENT '경험치 획득 이력',
  achievements JSON NULL COMMENT '획득한 성취도',
  dailyExperience INT NOT NULL DEFAULT 0 COMMENT '오늘 획득한 경험치',
  weeklyExperience INT NOT NULL DEFAULT 0 COMMENT '이번 주 획득한 경험치',
  monthlyExperience INT NOT NULL DEFAULT 0 COMMENT '이번 달 획득한 경험치',
  lastExperienceReset DATETIME NULL COMMENT '마지막 경험치 리셋 시간',
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_level (level),
  INDEX idx_totalExperience (totalExperience),
  INDEX idx_lastLevelUpAt (lastLevelUpAt),
  INDEX idx_user_level (user_id, level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='사용자 경험치 및 레벨 정보';

-- 4. 사용자 ID 22의 초기 경험치 데이터 생성 (이미 있으면 스킵)
INSERT INTO user_experience (
  user_id, 
  totalExperience, 
  level, 
  currentLevelExp, 
  expToNextLevel, 
  progressPercentage,
  totalLevelUps,
  highestLevel,
  dailyExperience,
  weeklyExperience,
  monthlyExperience
)
SELECT 22, 0, 1, 0, 100, 0, 0, 1, 0, 0, 0
WHERE NOT EXISTS (
  SELECT 1 FROM user_experience WHERE user_id = 22
);

-- 5. 모든 기존 사용자에게 경험치 데이터 생성 (선택사항)
INSERT INTO user_experience (
  user_id, 
  totalExperience, 
  level, 
  currentLevelExp, 
  expToNextLevel, 
  progressPercentage,
  totalLevelUps,
  highestLevel,
  dailyExperience,
  weeklyExperience,
  monthlyExperience
)
SELECT 
  u.user_id,
  0 as totalExperience,
  1 as level,
  0 as currentLevelExp,
  100 as expToNextLevel,
  0 as progressPercentage,
  0 as totalLevelUps,
  1 as highestLevel,
  0 as dailyExperience,
  0 as weeklyExperience,
  0 as monthlyExperience
FROM users u
WHERE NOT EXISTS (
  SELECT 1 FROM user_experience ue WHERE ue.user_id = u.user_id
);

-- 6. 데이터 확인
SELECT * FROM user_experience WHERE user_id = 22;
SELECT COUNT(*) as total_records FROM user_experience;

