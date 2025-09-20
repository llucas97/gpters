// frontend/src/pages/CodeEditorPage.tsx
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import CodeEditorInterface from '../components/CodeEditor/CodeEditorInterface';

export default function CodeEditorPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);

  // URL 파라미터에서 레벨, 토픽, 언어 가져오기
  const level = parseInt(searchParams.get('level') || '4');
  const topic = searchParams.get('topic') || 'algorithm';
  const language = searchParams.get('language') || 'python';

  useEffect(() => {
    loadProblem();
  }, [level, topic, language]);

  const loadProblem = async () => {
    try {
      setLoading(true);

      // 간단한 샘플 문제 생성
      const sampleProblem = {
        id: `editor_${level}_${Date.now()}`,
        title: `Level ${level} 코딩 문제`,
        level,
        language,
        statement: `다음 문제를 해결하는 프로그램을 작성하세요.\n\n두 수를 입력받아 그 합을 출력하는 프로그램을 작성하세요.`,
        examples: [
          {
            input: "3 5",
            output: "8"
          },
          {
            input: "10 20",
            output: "30"
          }
        ],
        difficulty: 'Easy',
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
    alert(`제출 완료!\n언어: ${result.language}\n코드 길이: ${result.code.length}자`);
  };

  const handleRun = (result) => {
    console.log('실행 결과:', result);
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
            <span className="ml-1">코드에디터</span>
          </div>
        </div>
        <div className="text-sm text-gray-600">
          안녕하세요, <span className="font-semibold text-blue-600">{user?.username || 'TestUser'}</span>님!
        </div>
      </div>

      {/* 코드에디터 인터페이스 */}
      <CodeEditorInterface
        problem={problem}
        onSubmit={handleSubmit}
        onRun={handleRun}
        language={language}
      />
    </div>
  );
}