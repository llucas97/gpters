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

interface TypeStatsDetailProps {
  userId: string;
  problemType: string;
}

const TypeStatsDetail: React.FC<TypeStatsDetailProps> = ({ userId, problemType }) => {
  const [loading, setLoading] = useState(true);
  const [typeStats, setTypeStats] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId && problemType) {
      loadTypeStats();
    }
  }, [userId, problemType]);

  const loadTypeStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await UserStatsService.getTypeStats(userId, problemType);
      
      if (result.success) {
        setTypeStats(result.analysis);
      } else {
        throw new Error(result.error || '유형별 통계를 불러올 수 없습니다');
      }

    } catch (err) {
      console.error('유형별 통계 로드 오류:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <p>유형별 통계를 불러오는 중...</p>
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

  if (!typeStats) {
    return (
      <Alert
        message="데이터 없음"
        description="유형별 통계 데이터를 찾을 수 없습니다."
        type="warning"
        showIcon
        style={{ margin: '20px' }}
      />
    );
  }

  const typeNames = {
    'block': '블록코딩',
    'cloze': '빈칸채우기',
    'code_editor': '코드에디터',
    'ordering': '순서배열',
    'bug_fix': '버그수정'
  };

  const typeName = typeNames[problemType] || problemType;

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
      render: (level) => `레벨 ${level}`,
    },
    {
      title: '점수',
      dataIndex: 'score',
      key: 'score',
      render: (score) => `${score || 0}점`,
    },
    {
      title: '결과',
      dataIndex: 'isCorrect',
      key: 'isCorrect',
      render: (isCorrect) => (
        isCorrect ? 
          <CheckCircleOutlined style={{ color: '#52c41a' }} /> : 
          <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
      ),
    },
    {
      title: '소요시간',
      dataIndex: 'duration',
      key: 'duration',
      render: (duration) => duration ? `${Math.round(duration / 1000)}초` : '-',
    },
    {
      title: '날짜',
      dataIndex: 'startedAt',
      key: 'startedAt',
      render: (date) => new Date(date).toLocaleDateString(),
    },
  ];

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '24px', textAlign: 'center' }}>
        📊 {typeName} 상세 통계
      </h2>

      {/* 유형별 핵심 통계 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="총 문제 수"
              value={typeStats.totalProblems}
              prefix={<BarChartOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="정답 수"
              value={typeStats.correctProblems}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="정확도"
              value={typeStats.accuracy}
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
              value={typeStats.averageScore}
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
                  percent={typeStats.accuracy} 
                  strokeColor={typeStats.accuracy >= 80 ? '#52c41a' : typeStats.accuracy >= 60 ? '#fa8c16' : '#ff4d4f'}
                  format={() => `${typeStats.accuracy.toFixed(1)}%`}
                />
                <p style={{ marginTop: '8px', textAlign: 'center' }}>
                  {typeStats.correctProblems}개 정답 / {typeStats.totalProblems}개 문제
                </p>
              </Card>

              {/* 레벨별 분석 */}
              {typeStats.levelAnalysis && typeStats.levelAnalysis.length > 0 && (
                <Card title="📈 레벨별 분석" style={{ marginBottom: '16px' }}>
                  <Row gutter={[16, 16]}>
                    {typeStats.levelAnalysis.map((level, index) => (
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
              {typeStats.timeAnalysis && typeStats.timeAnalysis.length > 0 && (
                <Card title="⏰ 시간대별 활동 패턴">
                  <Row gutter={[16, 16]}>
                    {typeStats.timeAnalysis.map((time, index) => (
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
                dataSource={typeStats.recentProblems}
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

export default TypeStatsDetail;
