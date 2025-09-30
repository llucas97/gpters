'use strict';

if (!global.fetch) {
  global.fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));
}

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

/**
 * 레벨 5: 버그 수정하기 문제 생성기
 * 올바른 코드를 생성한 후 의도적으로 버그를 삽입
 */

/**
 * 언어별 일반적인 버그 패턴 정의
 */
const BUG_PATTERNS = {
  javascript: [
    {
      type: 'operator_error',
      description: '연산자 오류',
      examples: [
        { correct: '+', wrong: '-' },
        { correct: '<=', wrong: '<' },
        { correct: '>=', wrong: '>' },
        { correct: '===', wrong: '==' },
        { correct: '&&', wrong: '||' }
      ]
    },
    {
      type: 'method_error',
      description: '메소드 오류',
      examples: [
        { correct: '.push(', wrong: '.pop(' },
        { correct: '.length', wrong: '.size' },
        { correct: '.charAt(', wrong: '.char(' },
        { correct: '.indexOf(', wrong: '.findIndex(' }
      ]
    },
    {
      type: 'syntax_error',
      description: '구문 오류',
      examples: [
        { correct: 'let ', wrong: 'var ' },
        { correct: 'const ', wrong: 'let ' },
        { correct: '++', wrong: '--' },
        { correct: 'return ', wrong: 'returns ' }
      ]
    },
    {
      type: 'logic_error',
      description: '논리 오류',
      examples: [
        { correct: 'i < arr.length', wrong: 'i <= arr.length' },
        { correct: 'i++', wrong: 'i--' },
        { correct: '= 0', wrong: '= 1' },
        { correct: '+ 1', wrong: '- 1' }
      ]
    }
  ],
  python: [
    {
      type: 'operator_error',
      description: '연산자 오류',
      examples: [
        { correct: '+', wrong: '-' },
        { correct: '<=', wrong: '<' },
        { correct: '>=', wrong: '>' },
        { correct: 'and', wrong: 'or' },
        { correct: '==', wrong: '=' }
      ]
    },
    {
      type: 'method_error',
      description: '메소드 오류',
      examples: [
        { correct: '.append(', wrong: '.add(' },
        { correct: 'len(', wrong: 'length(' },
        { correct: '.find(', wrong: '.search(' },
        { correct: 'range(', wrong: 'xrange(' }
      ]
    },
    {
      type: 'syntax_error',
      description: '구문 오류',
      examples: [
        { correct: 'def ', wrong: 'function ' },
        { correct: 'elif ', wrong: 'else if ' },
        { correct: 'True', wrong: 'true' },
        { correct: 'False', wrong: 'false' }
      ]
    },
    {
      type: 'logic_error',
      description: '논리 오류',
      examples: [
        { correct: 'range(len(', wrong: 'range(len(' },
        { correct: '+ 1', wrong: '- 1' },
        { correct: '= 0', wrong: '= 1' }
      ]
    }
  ]
};

/**
 * OpenAI를 통해 버그 없는 올바른 코드 생성
 */
async function generateCorrectCode({ level, topic, language }) {
  if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY missing');

  const systemPrompt = [
    'You are a programming education assistant that creates bug fixing exercises.',
    'Generate well-structured, correct code that will be used for debugging exercises.',
    'The code should be clear, educational, and contain common programming patterns.',
    `Use ${language} syntax and best practices.`,
    'Create code that demonstrates typical algorithmic concepts students should understand.',
    'Focus on loops, conditionals, variable assignments, and basic data operations.',
    'Make sure the code is completely correct and functional.',
    'Return ONLY the code, no explanations or markdown.'
  ].join(' ');

  const userPrompt = `Generate a complete working ${language} code for:
Level: ${level}
Topic: ${topic}

Requirements:
- 6-12 lines of meaningful code
- Clear algorithmic logic
- Include common programming patterns (loops, conditionals, operations)
- Use typical variable names and operations
- Make it educational and appropriate for intermediate students
- The code should be completely correct and bug-free
- Focus on readable, straightforward logic
- Return only the code, no explanations`;

  const body = {
    model: OPENAI_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.7,
    max_tokens: 1000
  };

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json', 
      Authorization: `Bearer ${OPENAI_API_KEY}` 
    },
    body: JSON.stringify(body)
  });

  const raw = await res.text();
  if (!res.ok) throw new Error(`OpenAI ${res.status}\n${raw}`);

  const data = JSON.parse(raw);
  return data.choices[0].message.content.trim();
}

/**
 * 코드에 의도적인 버그 삽입
 */
function insertBug(correctCode, language) {
  const lines = correctCode.split('\n');
  const bugPatterns = BUG_PATTERNS[language] || BUG_PATTERNS.javascript;
  
  // 의미 있는 라인들만 찾기 (주석, 빈 줄 제외)
  const meaningfulLines = lines
    .map((line, index) => ({ content: line, index }))
    .filter(({ content }) => {
      const trimmed = content.trim();
      return trimmed && 
             !trimmed.startsWith('//') && 
             !trimmed.startsWith('#') && 
             !trimmed.startsWith('/*') &&
             trimmed !== '{' && 
             trimmed !== '}';
    });

  if (meaningfulLines.length === 0) {
    throw new Error('No meaningful lines found to insert bugs');
  }

  // 랜덤하게 라인과 버그 패턴 선택
  const randomLine = meaningfulLines[Math.floor(Math.random() * meaningfulLines.length)];
  const randomPattern = bugPatterns[Math.floor(Math.random() * bugPatterns.length)];
  const randomExample = randomPattern.examples[Math.floor(Math.random() * randomPattern.examples.length)];

  let buggyCode = correctCode;
  let buggyLineNumber = randomLine.index + 1;
  let bugDescription = '';
  let actualBugInserted = false;

  // 선택된 버그 패턴을 적용해보기
  if (randomLine.content.includes(randomExample.correct)) {
    const buggyLineContent = randomLine.content.replace(
      new RegExp(escapeRegex(randomExample.correct), 'g'), 
      randomExample.wrong
    );
    
    const newLines = [...lines];
    newLines[randomLine.index] = buggyLineContent;
    buggyCode = newLines.join('\n');
    bugDescription = `${randomPattern.description}: '${randomExample.correct}'를 '${randomExample.wrong}'로 변경`;
    actualBugInserted = true;
  } else {
    // 첫 번째 패턴이 매칭되지 않으면 다른 패턴들 시도
    for (const pattern of bugPatterns) {
      for (const example of pattern.examples) {
        if (randomLine.content.includes(example.correct)) {
          const buggyLineContent = randomLine.content.replace(
            new RegExp(escapeRegex(example.correct), 'g'), 
            example.wrong
          );
          
          const newLines = [...lines];
          newLines[randomLine.index] = buggyLineContent;
          buggyCode = newLines.join('\n');
          bugDescription = `${pattern.description}: '${example.correct}'를 '${example.wrong}'로 변경`;
          actualBugInserted = true;
          break;
        }
      }
      if (actualBugInserted) break;
    }
  }

  // 버그 삽입에 실패한 경우 단순한 연산자 오류로 대체
  if (!actualBugInserted) {
    if (randomLine.content.includes('+')) {
      const buggyLineContent = randomLine.content.replace('+', '-');
      const newLines = [...lines];
      newLines[randomLine.index] = buggyLineContent;
      buggyCode = newLines.join('\n');
      bugDescription = "연산자 오류: '+'를 '-'로 변경";
      actualBugInserted = true;
    } else if (randomLine.content.includes('<=')) {
      const buggyLineContent = randomLine.content.replace('<=', '<');
      const newLines = [...lines];
      newLines[randomLine.index] = buggyLineContent;
      buggyCode = newLines.join('\n');
      bugDescription = "비교 연산자 오류: '<='를 '<'로 변경";
      actualBugInserted = true;
    }
  }

  return {
    buggyCode: actualBugInserted ? buggyCode : correctCode,
    buggyLineNumber,
    bugDescription: actualBugInserted ? bugDescription : '버그 삽입 실패',
    bugInserted: actualBugInserted
  };
}

/**
 * 정규식 특수문자 이스케이프
 */
function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * 문제 설명 생성
 */
async function generateBugFixDescription({ level, topic, language, correctCode, buggyCode, bugDescription }) {
  if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY missing');

  const systemPrompt = [
    'You are a programming education assistant.',
    'Generate problem description for bug fixing exercises in Korean.',
    'Make it educational and encourage students to understand the logic.',
    'Focus on helping students identify and fix common programming errors.'
  ].join(' ');

  const userPrompt = `Create a problem description for this ${language} bug fixing exercise:

Correct Code:
${correctCode}

Buggy Code:
${buggyCode}

Bug Type: ${bugDescription}
Level: ${level}
Topic: ${topic}

Return JSON format:
{
  "title": "문제 제목 (한국어)",
  "description": "코드에 버그가 있어 예상과 다른 결과가 나옵니다. 버그를 찾아 수정하세요. (한국어)",
  "instruction": "💡 코드의 버그를 찾아 직접 수정해주세요.",
  "hint": "버그가 있는 라인을 확인하고 논리적 오류를 찾아보세요.",
  "expectedBehavior": "이 코드가 올바르게 작동했을 때의 예상 동작 (한국어)"
}`;

  const body = {
    model: OPENAI_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.5,
    response_format: { type: 'json_object' }
  };

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json', 
      Authorization: `Bearer ${OPENAI_API_KEY}` 
    },
    body: JSON.stringify(body)
  });

  const raw = await res.text();
  if (!res.ok) throw new Error(`OpenAI ${res.status}\n${raw}`);

  const data = JSON.parse(raw);
  return JSON.parse(data.choices[0].message.content);
}

/**
 * 메인 버그 수정 문제 생성 함수
 */
async function generateBugFixProblem({ level = 5, topic = 'algorithm', language = 'javascript' }) {
  try {
    console.log(`Generating bug fix problem: Level ${level}, Topic: ${topic}, Language: ${language}`);

    // 1. 올바른 코드 생성
    const correctCode = await generateCorrectCode({ level, topic, language });
    console.log('Correct code generated:', correctCode);

    // 2. 버그 삽입
    const bugResult = insertBug(correctCode, language);
    console.log('Bug inserted:', bugResult.bugDescription);

    if (!bugResult.bugInserted) {
      throw new Error('Failed to insert bug into the generated code');
    }

    // 3. 문제 설명 생성
    const problemInfo = await generateBugFixDescription({ 
      level, 
      topic, 
      language, 
      correctCode,
      buggyCode: bugResult.buggyCode,
      bugDescription: bugResult.bugDescription
    });

    // 4. 최종 결과 반환
    const result = {
      title: problemInfo.title,
      description: problemInfo.description,
      instruction: problemInfo.instruction,
      hint: problemInfo.hint,
      expectedBehavior: problemInfo.expectedBehavior,
      level,
      topic,
      language,
      type: 'bug_fixing',
      correctCode,                    // 정답 코드 (검증용)
      buggyCode: bugResult.buggyCode, // 버그가 있는 코드 (사용자에게 제공)
      buggyLineNumber: bugResult.buggyLineNumber, // 버그가 있는 라인 번호
      bugDescription: bugResult.bugDescription,   // 버그 설명 (디버깅용)
      difficulty: level
    };

    console.log('Bug fix problem generated successfully');
    return result;

  } catch (error) {
    console.error('Error generating bug fix problem:', error);
    throw error;
  }
}

/**
 * 사용자 수정 코드 검증 함수
 */
function validateBugFix(problem, userCode) {
  if (!problem || !userCode) {
    return { 
      isCorrect: false, 
      score: 0, 
      feedback: '잘못된 입력입니다.' 
    };
  }

  const { correctCode, buggyCode } = problem;
  
  // 기본적인 유사성 검사
  const normalizeCode = (code) => code.replace(/\s+/g, ' ').trim().toLowerCase();
  
  const normalizedCorrect = normalizeCode(correctCode);
  const normalizedUser = normalizeCode(userCode);
  const normalizedBuggy = normalizeCode(buggyCode);

  // 사용자 코드가 정답과 일치하는지 확인
  const isExactMatch = normalizedUser === normalizedCorrect;
  
  // 사용자가 버그를 수정했는지 확인 (버그 코드와 다른지)
  const isDifferentFromBuggy = normalizedUser !== normalizedBuggy;
  
  // 유사성 점수 계산 (간단한 방식)
  const similarity = calculateSimilarity(normalizedCorrect, normalizedUser);
  const score = Math.round(similarity * 100);

  let feedback = '';
  let isCorrect = false;

  if (isExactMatch) {
    isCorrect = true;
    feedback = '완벽합니다! 버그를 정확히 수정했습니다.';
  } else if (isDifferentFromBuggy && score >= 80) {
    isCorrect = true;
    feedback = '잘했습니다! 버그가 수정된 것 같습니다.';
  } else if (isDifferentFromBuggy && score >= 60) {
    feedback = '버그는 수정했지만 다른 부분에서 차이가 있습니다. 다시 확인해보세요.';
  } else if (!isDifferentFromBuggy) {
    feedback = '아직 버그가 수정되지 않았습니다. 코드를 다시 살펴보세요.';
  } else {
    feedback = '코드에 오류가 있을 수 있습니다. 다시 확인해보세요.';
  }

  return {
    isCorrect,
    score: Math.max(score, isDifferentFromBuggy ? 30 : 0), // 최소 점수 보장
    feedback,
    similarity,
    isDifferentFromBuggy
  };
}

/**
 * 간단한 문자열 유사성 계산
 */
function calculateSimilarity(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = getEditDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

/**
 * 레벤슈타인 거리 계산
 */
function getEditDistance(str1, str2) {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,     // insertion
        matrix[j - 1][i] + 1,     // deletion
        matrix[j - 1][i - 1] + indicator // substitution
      );
    }
  }
  
  return matrix[str2.length][str1.length];
}

module.exports = {
  generateBugFixProblem,
  validateBugFix,
  insertBug,
  BUG_PATTERNS,
  calculateSimilarity
};
