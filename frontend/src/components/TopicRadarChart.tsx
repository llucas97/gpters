import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card } from 'antd';

interface TopicRadarChartProps {
  data: Array<{
    topic: string;
    accuracy: number;
    totalProblems: number;
    correctProblems: number;
  }>;
}

const TopicRadarChart: React.FC<TopicRadarChartProps> = ({ data }) => {
  // topic 한글명 매핑
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
    'heap': '힙',
    'programming': '프로그래밍'
  };

  // 유효한 topic만 필터링하고 데이터 포맷팅
  const validTopics = Object.keys(topicNames);
  const chartData = data
    .filter(item => validTopics.includes(item.topic)) // 유효한 topic만 포함
    .map(item => ({
      ...item,
      subject: topicNames[item.topic] || item.topic,
      accuracy: Math.round(item.accuracy * 10) / 10, // 소수점 1자리로 반올림
      fullMark: 100
    }));

  // 커스텀 툴팁
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{
          backgroundColor: 'white',
          padding: '10px',
          border: '1px solid #ccc',
          borderRadius: '5px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <p style={{ margin: 0, fontWeight: 'bold', color: '#1890ff' }}>
            {data.subject}
          </p>
          <p style={{ margin: '4px 0 0 0', color: '#52c41a' }}>
            정답률: {data.accuracy.toFixed(1)}%
          </p>
          <p style={{ margin: '4px 0 0 0', color: '#666' }}>
            {data.correctProblems}/{data.totalProblems} 문제
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card title="🎯 문제 Topic별 성취도" style={{ marginBottom: '24px' }}>
      {chartData.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
          아직 풀이한 문제가 없습니다
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={400}>
          <RadarChart data={chartData}>
            <PolarGrid stroke="#e0e0e0" />
            <PolarAngleAxis 
              dataKey="subject" 
              tick={{ fill: '#666', fontSize: 14 }}
            />
            <PolarRadiusAxis 
              angle={90} 
              domain={[0, 100]} 
              tick={{ fill: '#999', fontSize: 12 }}
            />
            <Radar
              name="정답률"
              dataKey="accuracy"
              stroke="#1890ff"
              fill="#1890ff"
              fillOpacity={0.6}
              strokeWidth={2}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="circle"
            />
          </RadarChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
};

export default TopicRadarChart;

