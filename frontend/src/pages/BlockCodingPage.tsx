// frontend/src/pages/BlockCodingPage.tsx
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import BlockCodingInterface from '../components/BlockCoding/BlockCodingInterface';

export default function BlockCodingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);

  // URL 파라미터에서 레벨과 토픽 가져오기
  const level = parseInt(searchParams.get('level') || '0');
  const topic = searchParams.get('topic') || 'basic';

  useEffect(() => {
    loadProblem();
  }, [level, topic]);

  const loadProblem = async () => {
    try {
      setLoading(true);

      // 간단한 샘플 문제 생성
      const sampleProblem = {
        id: `block_${level}_${Date.now()}`,
        title: `Level ${level} 블록코딩 문제`,
        statement: `블록을 드래그하여 알고리즘을 완성하세요.\n\n주어진 숫자를 입력받아 그 숫자만큼 "Hello"를 출력하는 프로그램을 만드세요.`,
        examples: [
          {
            input: "3",
            output: "Hello\nHello\nHello"
          }
        ],
        level,
        topic
      };

      setProblem(sampleProblem);
    } catch (error) {
      console.error('문제 로딩 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (result) => {
    console.log('제출 결과:', result);
    alert(`제출 완료!\n블록 개수: ${result.blocks.length}개\n생성된 코드:\n${result.generatedCode}`);
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">문제를 준비하고 있습니다...</p>
        </div>
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">문제를 찾을 수 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen">
      {/* 상단 네비게이션 */}
      <div className="bg-white border-b px-4 py-2 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/quiz')}
            className="text-gray-600 hover:text-gray-800"
          >
            ← 뒤로가기
          </button>
          <div className="text-sm text-gray-600">
            <span className="font-medium">Level {level}</span> • 
            <span className="ml-1">블록코딩</span>
          </div>
        </div>
        <div className="text-sm text-gray-600">
          안녕하세요, <span className="font-semibold text-blue-600">{user?.username || 'TestUser'}</span>님!
        </div>
      </div>

      {/* 블록코딩 인터페이스 */}
      <BlockCodingInterface
        problem={problem}
        onSubmit={handleSubmit}
      />
    </div>
  );
}