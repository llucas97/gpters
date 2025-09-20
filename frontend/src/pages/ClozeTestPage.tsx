// frontend/src/pages/ClozeTestPage.tsx
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ClozeTestInterface from '../components/ClozeTest/ClozeTestInterface';

export default function ClozeTestPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);

  // URL 파라미터에서 레벨과 토픽 가져오기
  const level = parseInt(searchParams.get('level') || '2');
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
        id: `cloze_${level}_${Date.now()}`,
        title: `Level ${level} 빈칸채우기 문제`,
        statement: `다음 알고리즘의 빈칸을 채워서 올바른 코드를 완성하세요.`,
        examples: [
          {
            input: "5",
            output: "15"
          }
        ],
        code: `def solution(n):
    result = [빈칸1]
    for i in range([빈칸2]):
        result += [빈칸3]
    return result`,
        blanks: [
          { id: 1, hint: "초기값", answer: "0" },
          { id: 2, hint: "반복 횟수", answer: "n" },
          { id: 3, hint: "증가값", answer: "i" }
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
    alert(`제출 완료!\n점수: ${result.score}점\n정답률: ${Object.keys(result.userAnswers).length}/${problem.blanks.length}`);
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
            <span className="ml-1">빈칸채우기</span>
          </div>
        </div>
        <div className="text-sm text-gray-600">
          안녕하세요, <span className="font-semibold text-blue-600">{user?.username || 'TestUser'}</span>님!
        </div>
      </div>

      {/* 빈칸채우기 인터페이스 */}
      <ClozeTestInterface
        problem={problem}
        onSubmit={handleSubmit}
      />
    </div>
  );
}