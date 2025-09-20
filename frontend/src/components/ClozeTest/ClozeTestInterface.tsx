// frontend/src/components/ClozeTest/ClozeTestInterface.tsx
import { useState, useEffect } from 'react';
import CodeDisplay from './CodeDisplay.tsx';
import BlankInput from './BlankInput.tsx';

interface ClozeTestInterfaceProps {
  problem: {
    id: string;
    title: string;
    statement: string;
    examples?: Array<{ input: string; output: string; explanation?: string }>;
    code: string;
    blanks: Array<{
      id: number;
      hint?: string;
      answer?: string;
    }>;
    level?: number;
    topic?: string;
  };
  onSubmit: (result: any) => void;
}

export default function ClozeTestInterface({
  problem,
  onSubmit
}: ClozeTestInterfaceProps) {
  const [userAnswers, setUserAnswers] = useState<{ [key: number]: string }>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  // 빈칸 답변 업데이트
  const handleAnswerChange = (blankId: number, answer: string) => {
    setUserAnswers(prev => ({
      ...prev,
      [blankId]: answer
    }));
  };

  // 제출
  const handleSubmit = () => {
    let correctCount = 0;
    const totalBlanks = problem.blanks.length;

    problem.blanks.forEach(blank => {
      if (userAnswers[blank.id] === blank.answer) {
        correctCount++;
      }
    });

    const score = totalBlanks > 0 ? Math.round((correctCount / totalBlanks) * 100) : 0;
    setScore(score);
    setIsSubmitted(true);

    const result = {
      userAnswers,
      correctAnswers: problem.blanks.reduce((acc, blank) => {
        acc[blank.id] = blank.answer;
        return acc;
      }, {} as { [key: number]: string }),
      score,
      isComplete: Object.keys(userAnswers).length === totalBlanks
    };

    onSubmit(result);
  };

  // 답변 완성도 확인
  const isComplete = Object.keys(userAnswers).length === problem.blanks.length;
  const allAnswered = problem.blanks.every(blank => userAnswers[blank.id]);

  return (
    <div className="cloze-test-interface h-screen flex flex-col bg-gray-50">
      {/* 1. 문제 전문 */}
      <div className="problem-section bg-white p-6 border-b">
        <h2 className="text-xl font-bold mb-4">{problem.title}</h2>
        <div className="text-gray-700 whitespace-pre-wrap">{problem.statement}</div>
        {problem.examples && (
          <div className="mt-4">
            <h3 className="font-semibold mb-2">예시:</h3>
            {problem.examples.map((example, index) => (
              <div key={index} className="mb-2 p-3 bg-gray-100 rounded">
                <div><strong>입력:</strong> {example.input}</div>
                <div><strong>출력:</strong> {example.output}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. 빈칸이 있는 알고리즘 */}
      <div className="algorithm-section bg-blue-50 p-4 border-b">
        <h3 className="font-semibold mb-2">알고리즘 (빈칸 채우기)</h3>
        <CodeDisplay 
          code={problem.code}
          blanks={problem.blanks}
          userAnswers={userAnswers}
          onAnswerChange={handleAnswerChange}
          isSubmitted={isSubmitted}
        />
      </div>

      {/* 3. 빈칸 입력 영역 */}
      <div className="flex-1 bg-white p-6">
        <h3 className="font-semibold mb-4">빈칸 답안 입력</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {problem.blanks.map((blank, index) => (
            <BlankInput
              key={blank.id}
              blank={blank}
              value={userAnswers[blank.id] || ''}
              onChange={(value) => handleAnswerChange(blank.id, value)}
              isSubmitted={isSubmitted}
              correctAnswer={blank.answer}
              index={index}
            />
          ))}
        </div>
      </div>

      {/* 4. 제출 버튼 */}
      <div className="submit-section bg-white p-4 border-t">
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            완료: {Object.keys(userAnswers).length}/{problem.blanks.length}개 빈칸
            {isSubmitted && (
              <span className="ml-2 font-semibold">
                점수: {score}점
              </span>
            )}
          </div>
          <button
            onClick={handleSubmit}
            disabled={!allAnswered || isSubmitted}
            className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isSubmitted ? '제출 완료' : '제출'}
          </button>
        </div>
      </div>
    </div>
  );
}