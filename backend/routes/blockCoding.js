// backend/routes/blockCoding.js
'use strict';

const express = require('express');
const router = express.Router();

// 블록코딩 문제 생성
router.post('/generate-problem', async (req, res) => {
  try {
    const { level, topic, language = 'python' } = req.body;

    // 레벨 0-1은 블록코딩으로 처리
    if (level > 1) {
      return res.status(400).json({
        error: 'Block coding is only available for levels 0-1'
      });
    }

    // 레벨에 따른 블록코딩 문제 생성
    const problem = generateBlockCodingProblem(level, topic, language);
    
    res.json(problem);
  } catch (error) {
    console.error('Block coding problem generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate block coding problem',
      detail: error.message 
    });
  }
});

// 블록코딩 솔루션 검증
router.post('/validate', async (req, res) => {
  try {
    const { problemId, generatedCode, blocks } = req.body;

    if (!problemId || !generatedCode || !blocks) {
      return res.status(400).json({
        error: 'Missing required fields: problemId, generatedCode, blocks'
      });
    }

    // 코드 검증 수행
    const validationResult = await validateBlockCodingSolution(
      problemId, 
      generatedCode, 
      blocks
    );

    res.json(validationResult);
  } catch (error) {
    console.error('Block coding validation error:', error);
    res.status(500).json({
      error: 'Failed to validate solution',
      detail: error.message
    });
  }
});

// 레벨별 추천 블록 목록
router.get('/recommended-blocks/:level', (req, res) => {
  try {
    const level = parseInt(req.params.level);
    
    if (isNaN(level) || level < 0 || level > 1) {
      return res.status(400).json({
        error: 'Invalid level. Block coding is available for levels 0-1 only.'
      });
    }

    const recommendedBlocks = getRecommendedBlocks(level);
    
    res.json({
      level,
      recommendedBlocks,
      description: `Level ${level} recommended blocks`
    });
  } catch (error) {
    console.error('Error getting recommended blocks:', error);
    res.status(500).json({
      error: 'Failed to get recommended blocks',
      detail: error.message
    });
  }
});

// 블록코딩 튜토리얼 문제들
router.get('/tutorial-problems', (req, res) => {
  try {
    const tutorialProblems = getTutorialProblems();
    res.json({ problems: tutorialProblems });
  } catch (error) {
    console.error('Error getting tutorial problems:', error);
    res.status(500).json({
      error: 'Failed to get tutorial problems',
      detail: error.message
    });
  }
});

// 블록코딩 문제 생성 함수
function generateBlockCodingProblem(level, topic, language) {
  const problemTemplates = {
    0: [
      {
        id: 'basic_input_output',
        title: '입력받고 출력하기',
        statement: '사용자로부터 이름을 입력받아서 "안녕하세요, [이름]님!"이라고 출력하는 프로그램을 만드세요.',
        expectedBlocks: ['input', 'variable', 'output'],
        examples: [
          {
            input: '홍길동',
            output: '안녕하세요, 홍길동님!',
            explanation: '입력받은 이름을 변수에 저장하고 인사말과 함께 출력합니다.'
          }
        ],
        hints: [
          '먼저 입력받기 블록을 사용하세요',
          '받은 값을 변수에 저장하세요',
          '인사말과 함께 출력하세요'
        ]
      },
      {
        id: 'simple_calculation',
        title: '간단한 계산',
        statement: '두 숫자를 입력받아서 더한 결과를 출력하는 프로그램을 만드세요.',
        expectedBlocks: ['input', 'variable', 'operation', 'output'],
        examples: [
          {
            input: '5\n3',
            output: '8',
            explanation: '5와 3을 더해서 8을 출력합니다.'
          }
        ],
        hints: [
          '첫 번째 숫자를 입력받으세요',
          '두 번째 숫자를 입력받으세요',
          '계산하기 블록으로 더하세요',
          '결과를 출력하세요'
        ]
      }
    ],
    1: [
      {
        id: 'conditional_greeting',
        title: '조건부 인사',
        statement: '나이를 입력받아서 18세 이상이면 "성인입니다", 미만이면 "미성년자입니다"를 출력하세요.',
        expectedBlocks: ['input', 'variable', 'comparison', 'if', 'output'],
        examples: [
          {
            input: '20',
            output: '성인입니다',
            explanation: '20은 18 이상이므로 성인입니다.'
          },
          {
            input: '15',
            output: '미성년자입니다',
            explanation: '15는 18 미만이므로 미성년자입니다.'
          }
        ],
        hints: [
          '나이를 입력받으세요',
          '18과 비교하세요',
          '조건문을 사용하세요',
          '각각의 경우에 맞는 메시지를 출력하세요'
        ]
      },
      {
        id: 'simple_loop',
        title: '숫자 세기',
        statement: '1부터 5까지 숫자를 차례대로 출력하는 프로그램을 만드세요.',
        expectedBlocks: ['for', 'variable', 'output'],
        examples: [
          {
            input: '',
            output: '1\n2\n3\n4\n5',
            explanation: '1부터 5까지 각 숫자를 한 줄씩 출력합니다.'
          }
        ],
        hints: [
          '반복하기 블록을 사용하세요',
          '1부터 5까지 반복하세요',
          '각 숫자를 출력하세요'
        ]
      }
    ]
  };

  const templates = problemTemplates[level] || problemTemplates[0];
  const template = templates[Math.floor(Math.random() * templates.length)];

  return {
    id: `${template.id}_${Date.now()}`,
    level,
    language,
    ...template,
    solution: generateSolutionBlocks(template, language)
  };
}

// 솔루션 블록 생성
function generateSolutionBlocks(template, language) {
  // 각 문제 템플릿에 대한 해답 블록 구성
  const solutions = {
    'basic_input_output': [
      {
        type: 'input',
        data: { variableName: 'name', inputType: 'string' },
        position: { x: 100, y: 100 }
      },
      {
        type: 'output',
        data: { expression: '"안녕하세요, " + name + "님!"' },
        position: { x: 100, y: 200 }
      }
    ],
    'simple_calculation': [
      {
        type: 'input',
        data: { variableName: 'num1', inputType: 'int' },
        position: { x: 100, y: 100 }
      },
      {
        type: 'input',
        data: { variableName: 'num2', inputType: 'int' },
        position: { x: 100, y: 200 }
      },
      {
        type: 'operation',
        data: { operator: '+', operands: ['num1', 'num2'] },
        position: { x: 100, y: 300 }
      },
      {
        type: 'output',
        data: { expression: 'result' },
        position: { x: 100, y: 400 }
      }
    ]
  };

  return {
    blocks: solutions[template.id] || [],
    code: generateCodeFromTemplate(template, language)
  };
}

// 템플릿으로부터 코드 생성
function generateCodeFromTemplate(template, language) {
  const codeTemplates = {
    'basic_input_output': {
      python: 'name = input()\nprint("안녕하세요, " + name + "님!")'
    },
    'simple_calculation': {
      python: 'num1 = int(input())\nnum2 = int(input())\nresult = num1 + num2\nprint(result)'
    }
  };

  return codeTemplates[template.id]?.[language] || '# Solution code';
}

// 블록코딩 솔루션 검증
async function validateBlockCodingSolution(problemId, generatedCode, blocks) {
  try {
    // 기본 검증 (구문 오류 등)
    const syntaxCheck = validateSyntax(generatedCode);
    if (!syntaxCheck.isValid) {
      return {
        isValid: false,
        score: 0,
        feedback: `구문 오류: ${syntaxCheck.error}`,
        errors: [{ blockId: 'syntax', message: syntaxCheck.error, type: 'error' }]
      };
    }

    // 블록 구조 검증
    const structureCheck = validateBlockStructure(blocks);
    if (!structureCheck.isValid) {
      return {
        isValid: false,
        score: 20,
        feedback: `블록 구조 오류: ${structureCheck.error}`,
        errors: structureCheck.errors
      };
    }

    // 예제 테스트 실행 (간단한 시뮬레이션)
    const testResults = await runTestCases(generatedCode, problemId);
    
    const score = calculateScore(syntaxCheck, structureCheck, testResults);
    const isValid = score >= 70; // 70점 이상이면 통과

    return {
      isValid,
      score,
      feedback: generateFeedback(isValid, score, testResults),
      errors: testResults.errors || [],
      suggestions: generateSuggestions(blocks, testResults)
    };

  } catch (error) {
    return {
      isValid: false,
      score: 0,
      feedback: '검증 중 오류가 발생했습니다.',
      errors: [{ blockId: 'system', message: error.message, type: 'error' }]
    };
  }
}

// 구문 검증
function validateSyntax(code) {
  try {
    // Python 기본 구문 검사
    const lines = code.split('\n');
    const errors = [];

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      // 기본적인 Python 구문 패턴 검사
      const invalidPatterns = [
        /^\s*if\s+.*(?<!:)$/,           // if without colon
        /^\s*for\s+.*(?<!:)$/,          // for without colon
        /^\s*while\s+.*(?<!:)$/,        // while without colon
        /^\s*def\s+.*(?<!:)$/,          // def without colon
      ];

      invalidPatterns.forEach(pattern => {
        if (pattern.test(trimmed)) {
          errors.push(`Line ${index + 1}: Missing colon`);
        }
      });
    });

    return {
      isValid: errors.length === 0,
      error: errors.join('; ')
    };
  } catch (error) {
    return {
      isValid: false,
      error: error.message
    };
  }
}

// 블록 구조 검증
function validateBlockStructure(blocks) {
  const errors = [];
  
  // 기본 구조 검증
  if (blocks.length === 0) {
    return {
      isValid: false,
      error: '블록이 없습니다.',
      errors: [{ blockId: 'structure', message: '최소 하나의 블록이 필요합니다.', type: 'error' }]
    };
  }

  // 시작점 검증 (previous 연결이 없는 블록)
  const rootBlocks = blocks.filter(block => !block.connections?.previous);
  if (rootBlocks.length === 0) {
    errors.push({ blockId: 'structure', message: '시작점이 없습니다.', type: 'error' });
  }

  // 고립된 블록 검증
  const isolatedBlocks = blocks.filter(block => 
    !block.connections?.previous && 
    !block.connections?.next && 
    (!block.connections?.children || block.connections.children.length === 0)
  );

  if (isolatedBlocks.length > 1) {
    errors.push({ 
      blockId: 'structure', 
      message: `${isolatedBlocks.length}개의 연결되지 않은 블록이 있습니다.`, 
      type: 'warning' 
    });
  }

  return {
    isValid: errors.filter(e => e.type === 'error').length === 0,
    error: errors.filter(e => e.type === 'error').map(e => e.message).join('; '),
    errors
  };
}

// 테스트 케이스 실행 (시뮬레이션)
async function runTestCases(code, problemId) {
  // 실제 환경에서는 안전한 코드 실행 환경이 필요
  // 여기서는 간단한 시뮬레이션으로 대체
  
  const testCases = getTestCasesForProblem(problemId);
  const results = [];
  
  for (const testCase of testCases) {
    try {
      // 간단한 코드 실행 시뮬레이션
      const result = simulateCodeExecution(code, testCase.input);
      const passed = result.output === testCase.expectedOutput;
      
      results.push({
        input: testCase.input,
        expected: testCase.expectedOutput,
        actual: result.output,
        passed
      });
    } catch (error) {
      results.push({
        input: testCase.input,
        expected: testCase.expectedOutput,
        actual: '',
        passed: false,
        error: error.message
      });
    }
  }
  
  return {
    passed: results.filter(r => r.passed).length,
    total: results.length,
    results,
    errors: results.filter(r => r.error).map(r => ({
      blockId: 'execution',
      message: r.error,
      type: 'error'
    }))
  };
}

// 간단한 코드 실행 시뮬레이션
function simulateCodeExecution(code, input) {
  // 실제로는 vm2나 다른 안전한 실행 환경 사용 필요
  // 여기서는 매우 기본적인 시뮬레이션만 구현
  
  let output = '';
  const inputLines = input.split('\n');
  let inputIndex = 0;
  
  // input() 함수 시뮬레이션
  const mockInput = () => {
    if (inputIndex < inputLines.length) {
      return inputLines[inputIndex++];
    }
    return '';
  };
  
  // print() 함수 시뮬레이션
  const mockPrint = (value) => {
    output += (output ? '\n' : '') + String(value);
  };
  
  try {
    // 매우 기본적인 Python 코드 해석
    const lines = code.split('\n');
    const variables = {};
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      
      // 변수 할당
      if (trimmed.includes(' = ')) {
        const [varName, expression] = trimmed.split(' = ', 2);
        const cleanVarName = varName.trim();
        
        if (expression.includes('input()')) {
          variables[cleanVarName] = mockInput();
        } else if (expression.includes('int(input())')) {
          variables[cleanVarName] = parseInt(mockInput());
        } else {
          // 간단한 계산 및 문자열 처리
          variables[cleanVarName] = evaluateExpression(expression, variables);
        }
      }
      
      // print 문
      if (trimmed.startsWith('print(')) {
        const expression = trimmed.slice(6, -1); // print( 와 ) 제거
        const value = evaluateExpression(expression, variables);
        mockPrint(value);
      }
    }
    
    return { output };
  } catch (error) {
    throw new Error(`실행 오류: ${error.message}`);
  }
}

// 간단한 표현식 평가
function evaluateExpression(expression, variables) {
  try {
    let expr = expression.trim();
    
    // 변수 치환
    for (const [varName, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\b${varName}\\b`, 'g');
      expr = expr.replace(regex, JSON.stringify(value));
    }
    
    // 문자열 연결 처리
    if (expr.includes(' + ')) {
      const parts = expr.split(' + ').map(part => {
        part = part.trim();
        if (part.startsWith('"') && part.endsWith('"')) {
          return part.slice(1, -1); // 문자열 리터럴
        }
        return JSON.parse(part); // 숫자나 다른 값
      });
      return parts.join('');
    }
    
    // 단순 숫자 계산
    if (/^[\d\s+\-*/()]+$/.test(expr)) {
      return eval(expr); // 실제 환경에서는 안전한 계산기 사용 필요
    }
    
    // JSON 파싱 시도
    try {
      return JSON.parse(expr);
    } catch {
      return expr;
    }
  } catch (error) {
    return expression;
  }
}

// 문제별 테스트 케이스
function getTestCasesForProblem(problemId) {
  // 실제로는 데이터베이스에서 가져오거나 문제 정의에서 추출
  return [
    { input: 'test', expectedOutput: '안녕하세요, test님!' },
    { input: '5\n3', expectedOutput: '8' }
  ];
}

// 점수 계산
function calculateScore(syntaxCheck, structureCheck, testResults) {
  let score = 0;
  
  if (syntaxCheck.isValid) score += 20;
  if (structureCheck.isValid) score += 30;
  
  if (testResults.total > 0) {
    const testScore = (testResults.passed / testResults.total) * 50;
    score += testScore;
  }
  
  return Math.round(score);
}

// 피드백 생성
function generateFeedback(isValid, score, testResults) {
  if (isValid) {
    return `훌륭합니다! 모든 테스트를 통과했습니다. (점수: ${score}/100)`;
  }
  
  if (score >= 50) {
    return `좋은 시도입니다! ${testResults.passed}/${testResults.total} 테스트를 통과했습니다. 조금만 더 수정해보세요.`;
  }
  
  return `아직 완성되지 않았습니다. 블록 연결과 설정을 다시 확인해보세요.`;
}

// 개선 제안 생성
function generateSuggestions(blocks, testResults) {
  const suggestions = [];
  
  if (blocks.length < 3) {
    suggestions.push('더 많은 블록이 필요할 수 있습니다.');
  }
  
  const hasInput = blocks.some(b => b.type === 'input');
  const hasOutput = blocks.some(b => b.type === 'output');
  
  if (!hasInput) {
    suggestions.push('입력받기 블록을 추가해보세요.');
  }
  
  if (!hasOutput) {
    suggestions.push('출력하기 블록을 추가해보세요.');
  }
  
  if (testResults.passed < testResults.total) {
    suggestions.push('출력 형식을 예제와 정확히 맞춰보세요.');
  }
  
  return suggestions;
}

// 레벨별 추천 블록
function getRecommendedBlocks(level) {
  const recommendations = {
    0: ['input', 'output', 'variable', 'operation'],
    1: ['input', 'output', 'variable', 'if', 'comparison', 'for', 'operation']
  };
  
  return recommendations[level] || recommendations[0];
}

// 튜토리얼 문제들
function getTutorialProblems() {
  return [
    {
      id: 'tutorial_1',
      title: '첫 번째 프로그램',
      level: 0,
      statement: '"Hello, World!"를 출력하는 프로그램을 만들어보세요.',
      expectedBlocks: ['output'],
      examples: [{ input: '', output: 'Hello, World!' }],
      hints: ['출력하기 블록만 사용하면 됩니다.']
    },
    {
      id: 'tutorial_2',
      title: '이름 입력받기',
      level: 0,
      statement: '이름을 입력받아서 출력하는 프로그램을 만들어보세요.',
      expectedBlocks: ['input', 'output'],
      examples: [{ input: '김철수', output: '김철수' }],
      hints: ['입력받기 블록과 출력하기 블록을 사용하세요.']
    }
  ];
}

module.exports = router;
