import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Progress, List, Statistic, Spin, Alert, Tabs, Table } from 'antd';
import { 
  CheckCircleOutlined, 
  CloseCircleOutlined,
  ClockCircleOutlined,
  BarChartOutlined,
  StarOutlined,
  TrophyOutlined
} from '@ant-design/icons';
import UserStatsService from '../services/userStatsService';

interface TopicStatsDetailProps {
  userId: string;
  topic: string;
}

const TopicStatsDetail: React.FC<TopicStatsDetailProps> = ({ userId, topic }) => {
  const [loading, setLoading] = useState(true);
  const [topicStats, setTopicStats] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId && topic) {
      loadTopicStats();
    }
  }, [userId, topic]);

  const loadTopicStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // topic을 type으로 조회 (임시로 type API 사용)
      // 추후 별도 topic API를 만들면 변경 필요
      const result = await UserStatsService.getTypeStats(userId, topic);
      
      if (result.success) {
        setTopicStats(result.analysis);
      } else {
        throw new Error(result.error || 'Topic별 통계를 불러올 수 없습니다');
      }

    } catch (err: any) {
      console.error('Topic별 통계 로드 오류:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <p>Topic별 통계를 불러오는 중...</p>
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

  if (!topicStats) {
    return (
      <Alert
        message="데이터 없음"
        description="Topic별 통계 데이터를 찾을 수 없습니다."
        type="warning"
        showIcon
        style={{ margin: '20px' }}
      />
    );
  }

  const topicNames: { [key: string]: string } = {
    'graph': '그래프',
    'dp': '동적계획법',
    'greedy': '그리디',
    'tree': '트리',
    'string': '문자열',
    'math': '수학',
    'sort': '정렬',
    'search': '탐색',
    'stack': '스택',
    'queue': '큐',
    'hash': '해시',
    'heap': '힙'
  };

  const topicName = topicNames[topic] || topic;

  // 최근 문제 테이블 컬럼 정의
  const recentProblemsColumns = [
    {
      title: '문제 제목',
      dataIndex: 'problemTitle',
      key: 'problemTitle',
      ellipsis: true,
    },
    {
      title: '레벨',
      dataIndex: 'level',
      key: 'level',
      render: (level: number) => `레벨 ${level}`,
    },
    {
      title: '점수',
      dataIndex: 'score',
      key: 'score',
      render: (score: number) => `${score || 0}점`,
    },
    {
      title: '결과',
      dataIndex: 'isCorrect',
      key: 'isCorrect',
      render: (isCorrect: boolean) => (
        isCorrect ? 
          <CheckCircleOutlined style={{ color: '#52c41a' }} /> : 
          <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
      ),
    },
    {
      title: '소요시간',
      dataIndex: 'duration',
      key: 'duration',
      render: (duration: number) => duration ? `${Math.round(duration / 1000)}초` : '-',
    },
    {
      title: '날짜',
      dataIndex: 'startedAt',
      key: 'startedAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
  ];

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '24px', textAlign: 'center' }}>
        📊 {topicName} 상세 통계
      </h2>

      {/* Topic별 핵심 통계 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="총 문제 수"
              value={topicStats.totalProblems}
              prefix={<BarChartOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="정답 수"
              value={topicStats.correctProblems}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="정확도"
              value={topicStats.accuracy}
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
              value={topicStats.averageScore}
              suffix="/ 100"
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Tabs defaultActiveKey="overview" items={[
        {
          key: 'overview',
          label: '개요',
          children: (
            <div>
              {/* 정확도 진행률 */}
              <Card title="🎯 정확도 진행률" style={{ marginBottom: '16px' }}>
                <Progress 
                  percent={topicStats.accuracy} 
                  strokeColor={topicStats.accuracy >= 80 ? '#52c41a' : topicStats.accuracy >= 60 ? '#fa8c16' : '#ff4d4f'}
                  format={() => `${topicStats.accuracy.toFixed(1)}%`}
                />
                <p style={{ marginTop: '8px', textAlign: 'center' }}>
                  {topicStats.correctProblems}개 정답 / {topicStats.totalProblems}개 문제
                </p>
              </Card>

              {/* 레벨별 분석 */}
              {topicStats.levelAnalysis && topicStats.levelAnalysis.length > 0 && (
                <Card title="📈 레벨별 분석" style={{ marginBottom: '16px' }}>
                  <Row gutter={[16, 16]}>
                    {topicStats.levelAnalysis.map((level: any, index: number) => (
                      <Col xs={24} sm={12} md={8} key={index}>
                        <Card size="small">
                          <div style={{ textAlign: 'center' }}>
                            <h4>레벨 {level.level}</h4>
                            <Progress 
                              percent={level.accuracy} 
                              strokeColor={level.accuracy >= 80 ? '#52c41a' : level.accuracy >= 60 ? '#fa8c16' : '#ff4d4f'}
                            />
                            <p style={{ marginTop: '8px', fontSize: '12px' }}>
                              {level.correctProblems}/{level.totalProblems} 정답
                            </p>
                            <p style={{ fontSize: '12px', color: '#666' }}>
                              평균: {level.averageScore.toFixed(1)}점
                            </p>
                          </div>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </Card>
              )}

              {/* 시간대별 분석 */}
              {topicStats.timeAnalysis && topicStats.timeAnalysis.length > 0 && (
                <Card title="⏰ 시간대별 활동 패턴">
                  <Row gutter={[16, 16]}>
                    {topicStats.timeAnalysis.map((time: any, index: number) => (
                      <Col xs={24} sm={12} md={8} key={index}>
                        <Card size="small">
                          <div style={{ textAlign: 'center' }}>
                            <h4>{time.timeSlot}</h4>
                            <Progress 
                              percent={time.accuracy} 
                              strokeColor={time.accuracy >= 80 ? '#52c41a' : time.accuracy >= 60 ? '#fa8c16' : '#ff4d4f'}
                            />
                            <p style={{ marginTop: '8px', fontSize: '12px' }}>
                              {time.totalProblems}개 문제, 평균 {time.averageScore.toFixed(1)}점
                            </p>
                          </div>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </Card>
              )}
            </div>
          )
        },
        {
          key: 'recent',
          label: '최근 문제',
          children: (
            <Card title="📝 최근 풀이한 문제들">
              <Table
                columns={recentProblemsColumns}
                dataSource={topicStats.recentProblems}
                rowKey="id"
                pagination={{ pageSize: 10 }}
                size="small"
              />
            </Card>
          )
        }
      ]} />
    </div>
  );
};

export default TopicStatsDetail;

