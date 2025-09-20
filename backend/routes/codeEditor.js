// backend/routes/codeEditor.js
const express = require('express');
const router = express.Router();
const { userLevelToStepRange } = require('../services/bojSteps');
const { searchProblemsByTier, getProblemDetail } = require('../services/solvedac');

// 코드 에디터용 문제 생성 API
router.post('/generate-problem', async (req, res) => {
  try {
    const { level, topic, language = 'python' } = req.body;

    // 기존 quiz API를 활용하여 문제 데이터 가져오기
    // 실제로는 별도의 복잡한 문제 DB나 API에서 가져올 수 있음
    
    // 더미 문제 데이터 (실제로는 문제 DB에서 가져오기)
    const codeEditorProblem = {
      id: `code_editor_${level}_${Date.now()}`,
      title: `Level ${level} 알고리즘 문제`,
      level: level,
      language: language,
      statement: generateProblemStatement(level, topic),
      constraints: generateConstraints(level),
      timeLimit: level <= 4 ? 1000 : 2000, // ms
      memoryLimit: 256, // MB
      examples: generateExamples(level, topic),
      starterCode: generateStarterCode(language, level, topic),
      hints: generateHints(level, topic),
      topic: topic,
      difficulty: level <= 4 ? 'Medium' : 'Hard',
      tags: generateTags(topic)
    };

    res.json(codeEditorProblem);
  } catch (error) {
    console.error('Error generating code editor problem:', error);
    res.status(500).json({ error: 'Failed to generate code editor problem' });
  }
});

// 코드 실행 API
router.post('/run', async (req, res) => {
  try {
    const { code, language, problemId, testCases } = req.body;

    // 실제로는 Docker 컨테이너나 샌드박스 환경에서 코드 실행
    // 여기서는 더미 실행 결과 반환
    const executionResult = await simulateCodeExecution(code, language, testCases);
    
    res.json(executionResult);
  } catch (error) {
    console.error('Error running code:', error);
    res.status(500).json({ 
      success: false,
      error: 'Code execution failed',
      output: '',
      testResults: []
    });
  }
});

// 코드 제출 API
router.post('/submit', async (req, res) => {
  try {
    const { code, language, problemId } = req.body;
    const userId = req.user?.id || 'anonymous';

    // 실제로는 모든 테스트 케이스에 대해 실행하고 채점
    const submissionResult = await simulateSubmission(code, language, problemId, userId);
    
    // 결과를 데이터베이스에 저장
    // await saveSubmission(submissionResult);
    
    res.json(submissionResult);
  } catch (error) {
    console.error('Error submitting code:', error);
    res.status(500).json({ error: 'Code submission failed' });
  }
});

// 제출 기록 조회 API
router.get('/submissions/:problemId', async (req, res) => {
  try {
    const { problemId } = req.params;
    const userId = req.user?.id || 'anonymous';

    // 실제로는 데이터베이스에서 조회
    const submissions = await getSubmissionHistory(problemId, userId);
    
    res.json(submissions);
  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

// 헬퍼 함수들

function generateProblemStatement(level, topic) {
  const statements = {
    'algorithm': {
      4: '주어진 배열에서 두 수의 합이 특정 값이 되는 모든 쌍을 찾아 반환하는 함수를 작성하세요.',
      5: '주어진 그래프에서 두 노드 간의 최단 경로를 찾는 알고리즘을 구현하세요.'
    },
    'data-structure': {
      4: '스택과 큐를 이용하여 회문(palindrome)을 판별하는 프로그램을 작성하세요.',
      5: 'AVL 트리를 구현하고, 삽입/삭제/검색 연산을 제공하세요.'
    }
  };
  
  return statements[topic]?.[level] || 
    `Level ${level}에 해당하는 ${topic} 관련 알고리즘 문제를 해결하세요.`;
}

function generateConstraints(level) {
  if (level <= 4) {
    return `• 1 ≤ n ≤ 1,000\n• 시간 제한: 1초\n• 메모리 제한: 256MB`;
  } else {
    return `• 1 ≤ n ≤ 100,000\n• 시간 제한: 2초\n• 메모리 제한: 256MB`;
  }
}

function generateExamples(level, topic) {
  if (topic === 'algorithm' && level === 4) {
    return [
      {
        input: '5\n[1, 2, 3, 4, 5]\n7',
        output: '[[2, 5], [3, 4]]',
        explanation: '배열에서 합이 7이 되는 쌍은 (2,5)와 (3,4)입니다.'
      },
      {
        input: '3\n[1, 1, 1]\n2',
        output: '[[1, 1], [1, 1], [1, 1]]',
        explanation: '모든 원소가 같을 때의 경우를 처리해야 합니다.'
      }
    ];
  }
  
  return [
    {
      input: '5\n1 2 3 4 5',
      output: '15',
      explanation: '입력 예제에 대한 기대 출력입니다.'
    }
  ];
}

function generateStarterCode(language, level, topic) {
  const templates = {
    python: {
      algorithm: `def solution(arr, target):
    """
    두 수의 합이 target이 되는 모든 쌍을 찾아 반환
    
    Args:
        arr: 정수 배열
        target: 목표 합
    
    Returns:
        List[List[int]]: 조건을 만족하는 모든 쌍
    """
    # 여기에 코드를 작성하세요
    pass

if __name__ == "__main__":
    n = int(input())
    arr = list(map(int, input().split()))
    target = int(input())
    
    result = solution(arr, target)
    for pair in result:
        print(pair)`,
      'data-structure': `class Stack:
    def __init__(self):
        # 여기에 코드를 작성하세요
        pass
    
    def push(self, item):
        # 여기에 코드를 작성하세요
        pass
    
    def pop(self):
        # 여기에 코드를 작성하세요
        pass

def is_palindrome(s):
    """
    스택을 이용하여 회문 판별
    """
    # 여기에 코드를 작성하세요
    pass

if __name__ == "__main__":
    s = input().strip()
    result = is_palindrome(s)
    print("YES" if result else "NO")`
    },
    javascript: {
      algorithm: `function solution(arr, target) {
    // 두 수의 합이 target이 되는 모든 쌍을 찾아 반환
    // 여기에 코드를 작성하세요
}

// 입력 처리
const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

let input = [];
rl.on('line', (line) => {
    input.push(line);
}).on('close', () => {
    const n = parseInt(input[0]);
    const arr = input[1].split(' ').map(Number);
    const target = parseInt(input[2]);
    
    const result = solution(arr, target);
    result.forEach(pair => console.log(pair));
});`
    }
  };
  
  return templates[language]?.[topic] || templates[language]?.algorithm || 
    `// ${language}로 ${topic} 문제를 해결하세요\n\nfunction solution() {\n    // 여기에 코드를 작성하세요\n}`;
}

function generateHints(level, topic) {
  const hints = [
    '문제를 작은 단위로 나누어 생각해보세요.',
    '시간 복잡도를 고려하여 효율적인 알고리즘을 사용하세요.',
    '경계 조건(edge case)을 빠뜨리지 않도록 주의하세요.'
  ];
  
  if (topic === 'algorithm') {
    hints.push('해시맵이나 정렬을 활용하면 도움이 될 수 있습니다.');
  }
  
  if (level >= 5) {
    hints.push('고급 자료구조나 알고리즘 기법을 활용해보세요.');
  }
  
  return hints;
}

function generateTags(topic) {
  const tagMap = {
    'algorithm': ['알고리즘', '구현', '탐색'],
    'data-structure': ['자료구조', '스택', '큐', '트리'],
    'graph': ['그래프', 'BFS', 'DFS', '최단경로'],
    'dp': ['동적계획법', 'DP', '최적화']
  };
  
  return tagMap[topic] || ['알고리즘', '구현'];
}

// 코드 실행 시뮬레이션
async function simulateCodeExecution(code, language, testCases) {
  // 실제로는 Docker나 샌드박스에서 실행
  // 여기서는 간단한 시뮬레이션
  
  try {
    // 코드 문법 체크 (간단한 예시)
    if (!code.trim()) {
      throw new Error('코드가 비어있습니다.');
    }
    
    if (language === 'python' && !code.includes('def')) {
      throw new Error('Python 함수 정의가 필요합니다.');
    }
    
    // 테스트 케이스 실행 결과 시뮬레이션
    const testResults = testCases.map((testCase, index) => {
      // 간단한 성공/실패 로직 (실제로는 코드 실행 결과와 비교)
      const passed = Math.random() > 0.3; // 70% 확률로 통과
      
      return {
        input: testCase.input,
        expectedOutput: testCase.output,
        actualOutput: passed ? testCase.output : '잘못된 출력',
        passed: passed,
        executionTime: Math.floor(Math.random() * 100) + 10 // 10-110ms
      };
    });
    
    const passedTests = testResults.filter(t => t.passed).length;
    const totalTests = testResults.length;
    
    return {
      success: passedTests === totalTests,
      output: 'Hello World!', // 실제 프로그램 출력
      executionTime: Math.floor(Math.random() * 200) + 50, // 50-250ms
      memoryUsage: Math.floor(Math.random() * 1024 * 1024) + 1024 * 1024, // 1-2MB
      testResults: testResults,
      score: Math.round((passedTests / totalTests) * 100),
      totalTests: totalTests,
      passedTests: passedTests
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message,
      output: '',
      testResults: []
    };
  }
}

// 코드 제출 시뮬레이션
async function simulateSubmission(code, language, problemId, userId) {
  const executionResult = await simulateCodeExecution(code, language, [
    { input: 'test input', output: 'expected output' }
  ]);
  
  const verdicts = ['Accepted', 'Wrong Answer', 'Time Limit Exceeded', 'Runtime Error'];
  const verdict = executionResult.success ? 'Accepted' : 
    verdicts[Math.floor(Math.random() * (verdicts.length - 1)) + 1];
  
  return {
    problemId: problemId,
    userId: userId,
    language: language,
    code: code,
    submittedAt: new Date().toISOString(),
    result: executionResult,
    verdict: verdict,
    score: executionResult.score || 0,
    attempts: Math.floor(Math.random() * 5) + 1
  };
}

// 제출 기록 조회 시뮬레이션
async function getSubmissionHistory(problemId, userId) {
  // 실제로는 데이터베이스에서 조회
  return []; // 빈 배열 반환
}

module.exports = router;
