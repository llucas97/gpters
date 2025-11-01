import React, { useState, useEffect } from 'react';
import ExperienceService from '../services/experienceService';
import './ExperienceDisplay.css';

/**
 * 경험치 및 레벨 표시 컴포넌트
 * 사용자의 현재 레벨, 경험치, 진행률을 시각적으로 표시
 */
const ExperienceDisplay = ({ userId, showStats = false, showRanking = false, className = '' }) => {
  const [experienceData, setExperienceData] = useState(null);
  const [stats, setStats] = useState(null);
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [levelUpAnimation, setLevelUpAnimation] = useState(null);

  // 경험치 데이터 로드
  useEffect(() => {
    loadExperienceData();
  }, [userId]);

  // 통계 데이터 로드
  useEffect(() => {
    if (showStats && userId) {
      loadStats();
    }
  }, [showStats, userId]);

  // 순위 데이터 로드
  useEffect(() => {
    if (showRanking) {
      loadRanking();
    }
  }, [showRanking]);

  const loadExperienceData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await ExperienceService.getUserExperience(userId);
      
      if (result.success) {
        setExperienceData(result.data);
      } else {
        setError(result.error || '경험치 정보를 불러올 수 없습니다');
      }
    } catch (err) {
      console.error('경험치 데이터 로드 오류:', err);
      setError('경험치 정보를 불러오는 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const result = await ExperienceService.getUserExperienceStats(userId);
      if (result.success) {
        setStats(result.data);
      }
    } catch (err) {
      console.error('통계 데이터 로드 오류:', err);
    }
  };

  const loadRanking = async () => {
    try {
      const result = await ExperienceService.getLevelRanking(10);
      if (result.success) {
        setRanking(result.data);
      }
    } catch (err) {
      console.error('순위 데이터 로드 오류:', err);
    }
  };

  const addExperience = async (problemData) => {
    try {
      const result = await ExperienceService.addExperience(userId, problemData);
      
      if (result.success) {
        // 레벨업 애니메이션 처리
        if (result.data.leveledUp) {
          setLevelUpAnimation(ExperienceService.generateLevelUpAnimation(experienceData, result.data));
          
          // 애니메이션 완료 후 제거
          setTimeout(() => {
            setLevelUpAnimation(null);
          }, 3000);
        }
        
        // 경험치 데이터 업데이트
        setExperienceData(result.data);
        
        return result;
      } else {
        setError(result.error || '경험치 추가에 실패했습니다');
        return result;
      }
    } catch (err) {
      console.error('경험치 추가 오류:', err);
      setError('경험치 추가 중 오류가 발생했습니다');
      return { success: false, error: err.message };
    }
  };

  const progress = ExperienceService.calculateProgress(experienceData);

  if (loading) {
    return (
      <div className={`experience-display loading ${className}`}>
        <div className="loading-spinner"></div>
        <span>경험치 정보를 불러오는 중...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`experience-display error ${className}`}>
        <div className="error-icon">⚠️</div>
        <span>{error}</span>
        <button onClick={loadExperienceData} className="retry-button">
          다시 시도
        </button>
      </div>
    );
  }

  if (!experienceData) {
    return (
      <div className={`experience-display no-data ${className}`}>
        <span>경험치 정보가 없습니다</span>
      </div>
    );
  }

  return (
    <div className={`experience-display ${className}`}>
      {/* 레벨업 애니메이션 */}
      {levelUpAnimation && (
        <div className="level-up-animation">
          <div className="level-up-content">
            <div className="level-up-title">레벨업!</div>
            <div className="level-up-level">
              {levelUpAnimation.oldLevel} → {levelUpAnimation.newLevel}
            </div>
            <div className="level-up-reward">
              +{levelUpAnimation.gainedExperience} 경험치
            </div>
            {levelUpAnimation.reward && (
              <div className="level-up-bonus">
                {levelUpAnimation.reward.title}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 메인 경험치 표시 */}
      <div className="experience-main">
        <div className="level-info">
          <div className="level-badge">
            <span className="level-number">{experienceData.level}</span>
            <span className="level-label">레벨</span>
          </div>
          <div className="experience-info">
            <div className="experience-text">
              {progress.display} 경험치
            </div>
            <div className="experience-bar">
              <div 
                className="experience-fill"
                style={{ width: `${progress.percentage}%` }}
              ></div>
            </div>
            <div className="progress-text">
              {progress.percentage}% 완료
            </div>
          </div>
        </div>
      </div>

      {/* 통계 정보 */}
      {showStats && stats && (
        <div className="experience-stats">
          <h3>경험치 통계</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">오늘 획득</span>
              <span className="stat-value">{stats.patterns?.dailyExp || 0}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">이번 주</span>
              <span className="stat-value">{stats.patterns?.weeklyExp || 0}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">이번 달</span>
              <span className="stat-value">{stats.patterns?.monthlyExp || 0}</span>
            </div>
          </div>
        </div>
      )}

      {/* 순위 정보 */}
      {showRanking && ranking.length > 0 && (
        <div className="experience-ranking">
          <h3>레벨 순위</h3>
          <div className="ranking-list">
            {ranking.map((rank, index) => (
              <div key={rank.userId} className={`ranking-item ${rank.userId === userId ? 'current-user' : ''}`}>
                <span className="rank-number">{rank.rank}</span>
                <span className="rank-username">{rank.username}</span>
                <span className="rank-level">Lv.{rank.level}</span>
                <span className="rank-exp">{rank.totalExperience.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 새로고침 버튼 */}
      <div className="experience-actions">
        <button onClick={loadExperienceData} className="refresh-button">
          새로고침
        </button>
      </div>
    </div>
  );
};

export default ExperienceDisplay;
