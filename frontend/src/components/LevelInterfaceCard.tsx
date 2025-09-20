// frontend/src/components/LevelInterfaceCard.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

interface LevelInterfaceInfo {
  levels: number[];
  title: string;
  description: string;
  features: string[];
  icon: string;
  color: string;
  route: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
}

const levelInterfaces: LevelInterfaceInfo[] = [
  {
    levels: [0, 1],
    title: '블록코딩',
    description: '드래그 앤 드롭으로 블록을 조립하여 프로그래밍 개념을 학습하세요',
    features: [
      '시각적 블록 조립',
      '드래그 앤 드롭 인터페이스', 
      '실시간 코드 생성',
      '단계별 힌트 시스템'
    ],
    icon: '🧩',
    color: 'from-blue-500 to-cyan-500',
    route: '/block-coding',
    difficulty: 'Beginner'
  },
  {
    levels: [2, 3],
    title: '빈칸채우기',
    description: '부분적으로 완성된 코드의 빈칸을 채워서 알고리즘을 완성하세요',
    features: [
      '코드 빈칸 채우기',
      '실시간 검증',
      '상세한 힌트 제공',
      '진행률 추적'
    ],
    icon: '📝',
    color: 'from-green-500 to-emerald-500',
    route: '/cloze-test',
    difficulty: 'Intermediate'
  },
  {
    levels: [4, 5],
    title: '코드 에디터',
    description: 'Monaco Editor로 전문적인 코딩 환경에서 복잡한 알고리즘을 구현하세요',
    features: [
      'Monaco Editor 통합',
      '문법 하이라이트 & 자동완성',
      '실시간 코드 실행 & 검증',
      '다중 언어 지원 (Python, Java, C++, JS)'
    ],
    icon: '💻',
    color: 'from-purple-500 to-pink-500',
    route: '/code-editor',
    difficulty: 'Advanced'
  }
];

interface LevelInterfaceCardProps {
  userLevel?: number;
}

export default function LevelInterfaceCard({ userLevel }: LevelInterfaceCardProps) {
  const navigate = useNavigate();

  const handleStartPractice = (interfaceInfo: LevelInterfaceInfo) => {
    const level = userLevel || interfaceInfo.levels[0];
    navigate(`${interfaceInfo.route}?level=${level}`);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'text-green-600 bg-green-100';
      case 'Intermediate': return 'text-yellow-600 bg-yellow-100';
      case 'Advanced': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const isRecommended = (interfaceInfo: LevelInterfaceInfo) => {
    if (!userLevel) return false;
    return interfaceInfo.levels.includes(userLevel);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {levelInterfaces.map((interfaceInfo) => (
        <div
          key={interfaceInfo.title}
          className={`relative overflow-hidden rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 ${
            isRecommended(interfaceInfo) ? 'ring-2 ring-blue-400' : ''
          }`}
        >
          {/* 추천 배지 */}
          {isRecommended(interfaceInfo) && (
            <div className="absolute top-4 right-4 z-10">
              <div className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                추천
              </div>
            </div>
          )}

          {/* 배경 그라데이션 */}
          <div className={`bg-gradient-to-br ${interfaceInfo.color} p-6 text-white`}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-4xl mb-2">{interfaceInfo.icon}</div>
                <h3 className="text-xl font-bold mb-1">{interfaceInfo.title}</h3>
                <div className="text-sm opacity-90">
                  Level {interfaceInfo.levels.join('-')}
                </div>
              </div>
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(interfaceInfo.difficulty)}`}>
                {interfaceInfo.difficulty}
              </div>
            </div>
            
            <p className="text-sm opacity-90 leading-relaxed">
              {interfaceInfo.description}
            </p>
          </div>

          {/* 기능 목록 */}
          <div className="bg-white p-6">
            <h4 className="font-medium text-gray-800 mb-3">주요 기능</h4>
            <ul className="space-y-2 mb-4">
              {interfaceInfo.features.map((feature, index) => (
                <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                  {feature}
                </li>
              ))}
            </ul>

            {/* 액션 버튼 */}
            <button
              onClick={() => handleStartPractice(interfaceInfo)}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 bg-gradient-to-r ${interfaceInfo.color} text-white hover:shadow-lg`}
            >
              {isRecommended(interfaceInfo) ? '시작하기 (추천)' : '체험해보기'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// 레벨 정보 헬퍼 컴포넌트
export function LevelInfoBanner({ userLevel }: { userLevel?: number }) {
  if (!userLevel) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🎯</span>
          <div>
            <h3 className="font-medium text-blue-800">레벨별 맞춤 학습</h3>
            <p className="text-sm text-blue-600">
              각 레벨에 최적화된 인터페이스로 단계적인 프로그래밍 학습을 시작하세요
            </p>
          </div>
        </div>
      </div>
    );
  }

  const currentInterface = levelInterfaces.find(info => 
    info.levels.includes(userLevel)
  );

  if (!currentInterface) {
    return null;
  }

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{currentInterface.icon}</span>
        <div>
          <h3 className="font-medium text-green-800">
            현재 레벨: {userLevel} - {currentInterface.title}
          </h3>
          <p className="text-sm text-green-600">
            {currentInterface.description}
          </p>
        </div>
      </div>
    </div>
  );
}
