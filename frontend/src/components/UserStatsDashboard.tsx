import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Progress, Statistic, Spin, Alert } from 'antd';
import { 
  TrophyOutlined, 
  CheckCircleOutlined,
  BarChartOutlined,
  StarOutlined
} from '@ant-design/icons';
import UserStatsService from '../services/userStatsService';
import TopicRadarChart from './TopicRadarChart';

interface UserStatsDashboardProps {
  userId: string;
}

const UserStatsDashboard: React.FC<UserStatsDashboardProps> = ({ userId }) => {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<any>(null);
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

      // overview에서 recentActivity도 함께 가져옴
      const overviewResult = await UserStatsService.getOverview(userId);

      if (overviewResult.success) {
        setOverview(overviewResult.stats);
        // overview에 포함된 recentActivity 사용
        setRecentActivity(overviewResult.stats?.recentActivity || null);
        console.log('[UserStatsDashboard] 최근 활동 데이터:', overviewResult.stats?.recentActivity);
      } else {
        throw new Error(overviewResult.error || '통계 데이터를 불러올 수 없습니다');
      }

    } catch (err) {
      console.error('사용자 통계 로드 오류:', err);
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다');
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

      {/* Topic별 성취도 레이더 차트 */}
      {overview.topicBreakdown && overview.topicBreakdown.length > 0 && (
        <TopicRadarChart data={overview.topicBreakdown} />
      )}

      {/* 레벨별 성취도 */}
      <Card title="📈 레벨별 성취도" style={{ marginBottom: '24px' }}>
        <Row gutter={[16, 16]}>
          {overview.levelBreakdown?.map((level: any, index: number) => (
            <Col xs={24} sm={12} md={8} lg={6} key={index}>
              <Card size="small">
                <div style={{ textAlign: 'center' }}>
                  <h4>레벨 {level.level}</h4>
                  <Progress 
                    type="circle" 
                    percent={level.accuracy} 
                    size={80}
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

      {/* 최근 활동 */}
      <Card title="📅 최근 7일 활동" style={{ marginBottom: '24px' }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={8}>
            <Card size="small">
              <Statistic
                title="문제 수"
                value={recentActivity?.totalProblems || 0}
                prefix={<BarChartOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card size="small">
              <Statistic
                title="정답 수"
                value={recentActivity?.correctProblems || 0}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card size="small">
              <Statistic
                title="평균 점수"
                value={recentActivity?.averageScore ? Number(recentActivity.averageScore).toFixed(1) : 0}
                suffix="/ 100"
                prefix={<TrophyOutlined />}
              />
            </Card>
          </Col>
        </Row>
      </Card>

    </div>
  );
};

export default UserStatsDashboard;
