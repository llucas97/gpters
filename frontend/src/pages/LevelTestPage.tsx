import React, { useState } from 'react';
import './LevelTestPage.css';

interface TestQuestion {
  id: number;
  level: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface TestResult {
  level: number;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
}

const LevelTestPage: React.FC = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [isTestComplete, setIsTestComplete] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 시력검사식 레벨테스트 문제들 (0-5단계)
  const testQuestions: TestQuestion[] = [
    // Level 0 - 초보자
    {
      id: 1,
      level: 0,
      question: "다음 중 변수 선언 방법이 올바른 것은?",
      options: [
        "var name = 'John';",
        "name = 'John';",
        "let name = 'John';",
        "const name = 'John';"
      ],
      correctAnswer: 2,
      explanation: "let과 const는 ES6에서 도입된 블록 스코프 변수 선언 방법입니다."
    },
    {
      id: 2,
      level: 0,
      question: "JavaScript에서 함수를 선언하는 방법은?",
      options: [
        "function myFunc() {}",
        "const myFunc = () => {}",
        "var myFunc = function() {}",
        "모두 올바름"
      ],
      correctAnswer: 3,
      explanation: "JavaScript에서는 여러 방법으로 함수를 선언할 수 있습니다."
    },
    // Level 1 - 쉬움
    {
      id: 3,
      level: 1,
      question: "다음 코드의 출력 결과는?\n\nconst arr = [1, 2, 3];\nconsole.log(arr.length);",
      options: ["2", "3", "4", "undefined"],
      correctAnswer: 1,
      explanation: "배열의 length 속성은 배열의 요소 개수를 반환합니다."
    },
    {
      id: 4,
      level: 1,
      question: "다음 중 배열 메서드가 아닌 것은?",
      options: ["push()", "pop()", "length()", "shift()"],
      correctAnswer: 2,
      explanation: "length는 메서드가 아닌 속성입니다."
    },
    // Level 2 - 보통
    {
      id: 5,
      level: 2,
      question: "다음 코드의 출력 결과는?\n\nconst obj = { a: 1, b: 2 };\nconst { a, b } = obj;\nconsole.log(a + b);",
      options: ["3", "12", "undefined", "에러"],
      correctAnswer: 0,
      explanation: "구조 분해 할당을 통해 객체의 속성을 변수로 추출할 수 있습니다."
    },
    {
      id: 6,
      level: 2,
      question: "Promise의 상태가 아닌 것은?",
      options: ["pending", "fulfilled", "rejected", "resolved"],
      correctAnswer: 3,
      explanation: "Promise의 상태는 pending, fulfilled, rejected입니다."
    },
    // Level 3 - 어려움
    {
      id: 7,
      level: 3,
      question: "다음 코드의 출력 결과는?\n\nasync function test() {\n  const result = await Promise.resolve(42);\n  return result * 2;\n}\ntest().then(console.log);",
      options: ["42", "84", "undefined", "Promise"],
      correctAnswer: 1,
      explanation: "async/await를 사용하여 Promise를 처리하고 결과를 반환합니다."
    },
    {
      id: 8,
      level: 3,
      question: "클로저(Closure)의 특징이 아닌 것은?",
      options: [
        "외부 함수의 변수에 접근 가능",
        "메모리 누수 가능성",
        "전역 변수와 동일한 스코프",
        "함수가 선언된 환경을 기억"
      ],
      correctAnswer: 2,
      explanation: "클로저는 외부 함수의 스코프를 기억하므로 전역 스코프와는 다릅니다."
    },
    // Level 4 - 전문가
    {
      id: 9,
      level: 4,
      question: "다음 코드의 출력 결과는?\n\nconst arr = [1, 2, 3, 4, 5];\nconst result = arr.reduce((acc, curr) => acc + curr, 0);\nconsole.log(result);",
      options: ["15", "10", "5", "에러"],
      correctAnswer: 0,
      explanation: "reduce 메서드는 배열의 모든 요소를 하나의 값으로 축약합니다."
    },
    {
      id: 10,
      level: 4,
      question: "다음 중 React Hook이 아닌 것은?",
      options: ["useState", "useEffect", "useContext", "useComponent"],
      correctAnswer: 3,
      explanation: "useComponent는 React Hook이 아닙니다."
    },
    // Level 5 - 마스터
    {
      id: 11,
      level: 5,
      question: "다음 코드의 출력 결과는?\n\nconst generator = function* () {\n  yield 1;\n  yield 2;\n  yield 3;\n};\nconst gen = generator();\nconsole.log(gen.next().value);",
      options: ["1", "2", "3", "undefined"],
      correctAnswer: 0,
      explanation: "제너레이터 함수는 yield 키워드로 값을 반환하고 실행을 일시 중단합니다."
    },
    {
      id: 12,
      level: 5,
      question: "다음 중 메모이제이션 패턴이 아닌 것은?",
      options: ["React.memo", "useMemo", "useCallback", "useRef"],
      correctAnswer: 3,
      explanation: "useRef는 메모이제이션과 관련이 없는 Hook입니다."
    }
  ];

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
  };

  const handleNextQuestion = () => {
    if (selectedAnswer !== null) {
      const newAnswers = [...answers, selectedAnswer];
      setAnswers(newAnswers);
      
      if (currentQuestion < testQuestions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedAnswer(null);
      } else {
        // 테스트 완료
        calculateResult(newAnswers);
        setIsTestComplete(true);
      }
    }
  };

  const calculateResult = (userAnswers: number[]) => {
    let correctCount = 0;
    let totalScore = 0;
    
    userAnswers.forEach((answer, index) => {
      const question = testQuestions[index];
      if (answer === question.correctAnswer) {
        correctCount++;
        totalScore += question.level + 1; // 레벨에 따른 가중치
      }
    });

    // 레벨 계산 (0-5)
    const averageScore = totalScore / testQuestions.length;
    const determinedLevel = Math.min(5, Math.max(0, Math.floor(averageScore)));

    setTestResult({
      level: determinedLevel,
      score: totalScore,
      totalQuestions: testQuestions.length,
      correctAnswers: correctCount
    });
  };

  const handleSubmitResult = async () => {
    if (!testResult) return;
    
    setIsLoading(true);
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      const response = await fetch(`${API_BASE_URL}/api/level-test/submit`, {
        method: 'POST',
        credentials: 'include', // 세션 쿠키 포함
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          level: testResult.level,
          score: testResult.score,
          totalQuestions: testResult.totalQuestions,
          correctAnswers: testResult.correctAnswers,
          answers: answers
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('레벨테스트 저장 성공:', result);
        alert('레벨테스트 결과가 저장되었습니다!');
        // 홈페이지로 리다이렉트 또는 다음 단계로 이동
        window.location.href = '/';
      } else {
        const errorData = await response.json().catch(() => ({ message: '알 수 없는 오류' }));
        throw new Error(`결과 저장에 실패했습니다: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error submitting result:', error);
      
      // 더 자세한 오류 정보 표시
      let errorMessage = '결과 저장 중 오류가 발생했습니다.';
      if (error instanceof Error) {
        errorMessage += `\n오류: ${error.message}`;
      }
      
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const resetTest = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setAnswers([]);
    setIsTestComplete(false);
    setTestResult(null);
  };

  if (isTestComplete && testResult) {
    return (
      <div className="level-test-container">
        <div className="test-result">
          <h2>🎉 레벨테스트 완료!</h2>
          <div className="result-card">
            <div className="level-badge">
              <span className="level-number">Level {testResult.level}</span>
              <span className="level-description">
                {testResult.level === 0 && "초보자"}
                {testResult.level === 1 && "쉬움"}
                {testResult.level === 2 && "보통"}
                {testResult.level === 3 && "어려움"}
                {testResult.level === 4 && "전문가"}
                {testResult.level === 5 && "마스터"}
              </span>
            </div>
            <div className="score-details">
              <p>정답률: {Math.round((testResult.correctAnswers / testResult.totalQuestions) * 100)}%</p>
              <p>맞힌 문제: {testResult.correctAnswers}/{testResult.totalQuestions}</p>
              <p>총 점수: {testResult.score}점</p>
            </div>
            <div className="result-actions">
              <button 
                className="btn-primary" 
                onClick={handleSubmitResult}
                disabled={isLoading}
              >
                {isLoading ? '저장 중...' : '결과 저장하기'}
              </button>
              <button className="btn-secondary" onClick={resetTest}>
                다시 테스트하기
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentQ = testQuestions[currentQuestion];
  const progress = ((currentQuestion + 1) / testQuestions.length) * 100;

  return (
    <div className="level-test-container">
      <div className="test-header">
        <h1>🎯 레벨테스트</h1>
        <p>당신의 프로그래밍 실력을 측정해보세요!</p>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }}></div>
        </div>
        <div className="question-counter">
          {currentQuestion + 1} / {testQuestions.length}
        </div>
      </div>

      <div className="question-card">
        <div className="question-header">
          <span className="level-indicator">Level {currentQ.level}</span>
          <span className="difficulty">
            {currentQ.level === 0 && "초보자"}
            {currentQ.level === 1 && "쉬움"}
            {currentQ.level === 2 && "보통"}
            {currentQ.level === 3 && "어려움"}
            {currentQ.level === 4 && "전문가"}
            {currentQ.level === 5 && "마스터"}
          </span>
        </div>
        
        <div className="question-content">
          <h3>{currentQ.question}</h3>
        </div>

        <div className="options">
          {currentQ.options.map((option, index) => (
            <button
              key={index}
              className={`option-btn ${selectedAnswer === index ? 'selected' : ''}`}
              onClick={() => handleAnswerSelect(index)}
            >
              <span className="option-letter">{String.fromCharCode(65 + index)}</span>
              <span className="option-text">{option}</span>
            </button>
          ))}
        </div>

        <div className="question-actions">
          <button
            className="btn-primary"
            onClick={handleNextQuestion}
            disabled={selectedAnswer === null}
          >
            {currentQuestion === testQuestions.length - 1 ? '테스트 완료' : '다음 문제'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LevelTestPage;
