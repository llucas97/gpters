import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Select, Button, Spin, Alert, Tabs, Space } from 'antd';
import { 
  BarChartOutlined, 
  TrophyOutlined,
  StarOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import UserStatsDashboard from '../components/UserStatsDashboard';
import LevelStatsDetail from '../components/LevelStatsDetail';
import TypeStatsDetail from '../components/TypeStatsDetail';

const UserStatsPage: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setLoading(false);
  }, [isAuthenticated, navigate]);

  const levelOptions = [
    { value: 0, label: '레벨 0' },
    { value: 1, label: '레벨 1' },
    { value: 2, label: '레벨 2' },
    { value: 3, label: '레벨 3' },
    { value: 4, label: '레벨 4' },
    { value: 5, label: '레벨 5' }
  ];

  const typeOptions = [
    { value: 'block', label: '블록코딩' },
    { value: 'cloze', label: '빈칸채우기' },
    { value: 'code_editor', label: '코드에디터' },
    { value: 'ordering', label: '순서배열' },
    { value: 'bug_fix', label: '버그수정' }
  ];

  const tabItems = [
    {
      key: 'overview',
      label: '전체 통계',
      icon: <BarChartOutlined />,
      children: <UserStatsDashboard userId={user?.id?.toString() || '1'} />
    },
    {
      key: 'level',
      label: '레벨별 분석',
      icon: <TrophyOutlined />,
      children: (
        <div>
          <Card style={{ marginBottom: '16px' }}>
            <Space>
              <span>레벨 선택:</span>
              <Select
                placeholder="레벨을 선택하세요"
                style={{ width: 150 }}
                options={levelOptions}
                value={selectedLevel}
                onChange={setSelectedLevel}
              />
              <Button 
                type="primary" 
                onClick={() => setActiveTab('level-detail')}
                disabled={selectedLevel === null}
              >
                분석 보기
              </Button>
            </Space>
          </Card>
          {selectedLevel !== null && (
            <LevelStatsDetail userId={user?.id?.toString() || '1'} level={selectedLevel} />
          )}
        </div>
      )
    },
    {
      key: 'type',
      label: '유형별 분석',
      icon: <StarOutlined />,
      children: (
        <div>
          <Card style={{ marginBottom: '16px' }}>
            <Space>
              <span>문제 유형 선택:</span>
              <Select
                placeholder="문제 유형을 선택하세요"
                style={{ width: 150 }}
                options={typeOptions}
                value={selectedType}
                onChange={setSelectedType}
              />
              <Button 
                type="primary" 
                onClick={() => setActiveTab('type-detail')}
                disabled={selectedType === null}
              >
                분석 보기
              </Button>
            </Space>
          </Card>
          {selectedType && (
            <TypeStatsDetail userId={user?.id?.toString() || '1'} problemType={selectedType} />
          )}
        </div>
      )
    }
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <p>통계 페이지를 불러오는 중...</p>
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

  if (!isAuthenticated || !user) {
    return (
      <Alert
        message="로그인 필요"
        description="통계를 보려면 로그인이 필요합니다."
        type="warning"
        showIcon
        style={{ margin: '20px' }}
      />
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '32px' }}>
        📊 나의 학습 통계
      </h1>
      
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        size="large"
        style={{ minHeight: '600px' }}
      />
    </div>
  );
};

export default UserStatsPage;
