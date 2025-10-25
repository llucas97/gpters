import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Progress, Badge, List, Statistic, Spin, Alert } from 'antd';
import { 
  TrophyOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined,
  ClockCircleOutlined,
  BarChartOutlined,
  StarOutlined
} from '@ant-design/icons';
import UserStatsService from '../services/userStatsService';

interface UserStatsDashboardProps {
  userId: string;
}

const UserStatsDashboard: React.FC<UserStatsDashboardProps> = ({ userId }) => {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<any>(null);
  const [achievements, setAchievements] = useState<any>(null);
  const [recentActivity, setRecentActivity] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      loadUserStats();
    }
  }, [userId]);

  const loadUserStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // 병렬로 모든 데이터 로드
      const [overviewResult, achievementsResult, recentResult] = await Promise.all([
        UserStatsService.getOverview(userId),
        UserStatsService.getAchievements(userId),
        UserStatsService.getRecentActivity(userId)
      ]);

      if (overviewResult.success) {
        setOverview(overviewResult.stats);
      } else {
        throw new Error(overviewResult.error || '통계 데이터를 불러올 수 없습니다');
      }

      if (achievementsResult.success) {
        setAchievements(achievementsResult.achievements);
      }

      if (recentResult.success) {
        setRecentActivity(recentResult.recentActivity);
      }

    } catch (err) {
      console.error('사용자 통계 로드 오류:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <p>통계 데이터를 불러오는 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="오류 발생"
        description={error}
        type="error"
        showIcon
        style={{ margin: '20px' }}
      />
    );
  }

  if (!overview) {
    return (
      <Alert
        message="데이터 없음"
        description="통계 데이터를 찾을 수 없습니다."
        type="warning"
        showIcon
        style={{ margin: '20px' }}
      />
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '24px', textAlign: 'center' }}>
        📊 나의 학습 통계
      </h2>

      {/* 전체 통계 개요 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="총 문제 수"
              value={overview.totalProblems}
              prefix={<BarChartOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="정답 수"
              value={overview.correctProblems}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="정확도"
              value={overview.accuracy}
              suffix="%"
              prefix={<StarOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="평균 점수"
              value={overview.averageScore}
              suffix="/ 100"
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 성취도 등급 */}
      {overview.achievementLevel && (
        <Card title="🏆 성취도 등급" style={{ marginBottom: '24px' }}>
          <div style={{ textAlign: 'center' }}>
            <Badge 
              count={overview.achievementLevel.level} 
              style={{ 
                backgroundColor: overview.achievementLevel.color,
                fontSize: '24px',
                width: '60px',
                height: '60px',
                lineHeight: '60px'
              }}
            />
            <h3 style={{ marginTop: '16px', color: overview.achievementLevel.color }}>
              {overview.achievementLevel.name}
            </h3>
            <p>정확도 {overview.accuracy.toFixed(1)}% 달성</p>
          </div>
        </Card>
      )}

      {/* 레벨별 성취도 */}
      <Card title="📈 레벨별 성취도" style={{ marginBottom: '24px' }}>
        <Row gutter={[16, 16]}>
          {overview.levelBreakdown?.map((level, index) => (
            <Col xs={24} sm={12} md={8} lg={6} key={index}>
              <Card size="small">
                <div style={{ textAlign: 'center' }}>
                  <h4>레벨 {level.level}</h4>
                  <Progress 
                    type="circle" 
                    percent={level.accuracy} 
                    width={80}
                    format={() => `${level.correctProblems}/${level.totalProblems}`}
                  />
                  <p style={{ marginTop: '8px', fontSize: '12px' }}>
                    정확도: {level.accuracy.toFixed(1)}%
                  </p>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      {/* 문제 유형별 성취도 */}
      <Card title="🎯 문제 유형별 성취도" style={{ marginBottom: '24px' }}>
        <Row gutter={[16, 16]}>
          {overview.typeBreakdown?.map((type, index) => {
            const typeNames = {
              'block': '블록코딩',
              'cloze': '빈칸채우기',
              'code_editor': '코드에디터',
              'ordering': '순서배열',
              'bug_fix': '버그수정'
            };
            
            return (
              <Col xs={24} sm={12} md={8} lg={6} key={index}>
                <Card size="small">
                  <div style={{ textAlign: 'center' }}>
                    <h4>{typeNames[type.problemType] || type.problemType}</h4>
                    <Progress 
                      percent={type.accuracy} 
                      strokeColor={type.accuracy >= 80 ? '#52c41a' : type.accuracy >= 60 ? '#fa8c16' : '#ff4d4f'}
                    />
                    <p style={{ marginTop: '8px', fontSize: '12px' }}>
                      {type.correctProblems}/{type.totalProblems} 문제 정답
                    </p>
                    <p style={{ fontSize: '12px', color: '#666' }}>
                      평균 점수: {type.averageScore.toFixed(1)}점
                    </p>
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      </Card>

      {/* 최근 활동 */}
      {recentActivity && (
        <Card title="📅 최근 7일 활동" style={{ marginBottom: '24px' }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={8}>
              <Card size="small">
                <Statistic
                  title="문제 수"
                  value={recentActivity.totalProblems}
                  prefix={<BarChartOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card size="small">
                <Statistic
                  title="정답 수"
                  value={recentActivity.correctProblems}
                  prefix={<CheckCircleOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card size="small">
                <Statistic
                  title="평균 점수"
                  value={recentActivity.averageScore}
                  suffix="/ 100"
                  prefix={<TrophyOutlined />}
                />
              </Card>
            </Col>
          </Row>
        </Card>
      )}

      {/* 성취도 및 뱃지 */}
      {achievements && (
        <Card title="🏅 성취도 및 뱃지">
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <Card size="small">
                <Statistic
                  title="총 뱃지 수"
                  value={achievements.totalAchievements}
                  prefix={<TrophyOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12}>
              <Card size="small">
                <h4>획득한 뱃지</h4>
                <List
                  size="small"
                  dataSource={achievements.achievements}
                  renderItem={(achievement) => (
                    <List.Item>
                      <Badge 
                        status="success" 
                        text={achievement.name}
                        style={{ fontSize: '12px' }}
                      />
                    </List.Item>
                  )}
                />
              </Card>
            </Col>
          </Row>
          
          {achievements.nextGoals && achievements.nextGoals.length > 0 && (
            <Card size="small" style={{ marginTop: '16px' }}>
              <h4>🎯 다음 목표</h4>
              <List
                size="small"
                dataSource={achievements.nextGoals}
                renderItem={(goal) => (
                  <List.Item>
                    <div style={{ width: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span>{goal.description}</span>
                        <span>{goal.current}/{goal.target}</span>
                      </div>
                      <Progress 
                        percent={(goal.current / goal.target) * 100} 
                        size="small"
                        strokeColor="#1890ff"
                      />
                    </div>
                  </List.Item>
                )}
              />
            </Card>
          )}
        </Card>
      )}
    </div>
  );
};

export default UserStatsDashboard;
