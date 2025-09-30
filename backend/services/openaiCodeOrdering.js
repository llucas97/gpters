'use strict';

if (!global.fetch) {
  global.fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));
}

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

/**
 * 레벨 4: 순서 맞추기 문제 생성기
 * 올바른 코드를 생성한 후 라인 순서를 섞어서 제공
 */

/**
 * 코드 라인을 섞는 함수
 */
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * 코드에서 의미 있는 라인들만 추출 (주석, 빈 줄 제외)
 */
function extractMeaningfulLines(code) {
  const lines = code.split('\n');
  const meaningfulLines = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // 빈 줄이나 주석만 있는 줄은 제외
    if (line && 
        !line.startsWith('//') && 
        !line.startsWith('#') && 
        !line.startsWith('/*') && 
        !line.startsWith('*') &&
        line !== '{' && 
        line !== '}') {
      meaningfulLines.push({
        content: lines[i], // 원본 들여쓰기 유지
        originalIndex: i
      });
    }
  }
  
  return meaningfulLines;
}

/**
 * 코드 복잡도에 따라 섞을 라인 수 결정
 */
function calculateLinesToShuffle(meaningfulLines, level) {
  const totalLines = meaningfulLines.length;
  
  // 레벨 4는 중간 난이도이므로 적절한 라인 수 선택
  if (totalLines <= 3) return totalLines; // 모든 라인
  if (totalLines <= 5) return Math.max(3, totalLines - 1); // 최소 3라인
  if (totalLines <= 8) return Math.max(4, Math.floor(totalLines * 0.7)); // 70%
  
  return Math.max(5, Math.min(8, Math.floor(totalLines * 0.6))); // 최대 8라인
}

/**
 * OpenAI를 통해 순서 맞추기용 코드 생성
 */
async function generateOrderingCode({ level, topic, language }) {
  if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY missing');

  const systemPrompt = [
    'You are a programming education assistant that creates code ordering exercises.',
    'Generate well-structured, educational code that can be used for line ordering exercises.',
    'The code should have a clear logical flow that students can follow.',
    `Use ${language} syntax and best practices.`,
    'Create code with meaningful steps that have dependencies between lines.',
    'Each line should serve a specific purpose in the overall algorithm.',
    'Avoid overly complex nested structures that would be confusing to reorder.',
    'Focus on sequential logic, variable assignments, calculations, and simple control flow.',
    'Return ONLY the code, no explanations or markdown.'
  ].join(' ');

  const userPrompt = `Generate a complete working ${language} code for:
Level: ${level}
Topic: ${topic}

Requirements:
- 5-10 lines of meaningful code
- Clear sequential logic that students can follow
- Each line should have a logical dependency on previous lines
- Include variable declarations, calculations, and simple operations
- Avoid complex nested structures
- Make it educational and appropriate for intermediate students
- Return only the code, no explanations`;

  const body = {
    model: OPENAI_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.7,
    max_tokens: 800
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
 * 문제 설명 생성
 */
async function generateOrderingDescription({ level, topic, language, code }) {
  if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY missing');

  const systemPrompt = [
    'You are a programming education assistant.',
    'Generate problem description for code ordering exercises in Korean.',
    'Make it clear and educational for intermediate students.',
    'Focus on the logical flow and dependencies between code lines.'
  ].join(' ');

  const userPrompt = `Create a problem description for this ${language} code ordering exercise:
${code}

Level: ${level}
Topic: ${topic}

Return JSON format:
{
  "title": "문제 제목 (한국어)",
  "description": "코드의 논리적 흐름을 파악하여 올바른 순서로 배열하는 문제 설명 (한국어)",
  "instruction": "Alt + ↑/↓ 키를 사용해 코드 라인의 순서를 맞춰주세요.",
  "explanation": "이 코드가 수행하는 작업에 대한 간단한 설명 (한국어)"
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
 * 메인 순서 맞추기 문제 생성 함수
 */
async function generateCodeOrderingProblem({ level = 4, topic = 'algorithm', language = 'javascript' }) {
  try {
    console.log(`Generating code ordering problem: Level ${level}, Topic: ${topic}, Language: ${language}`);

    // 1. 올바른 순서의 코드 생성
    const correctCode = await generateOrderingCode({ level, topic, language });
    console.log('Correct code generated:', correctCode);

    // 2. 의미 있는 라인들 추출
    const meaningfulLines = extractMeaningfulLines(correctCode);
    console.log(`Found ${meaningfulLines.length} meaningful lines`);

    if (meaningfulLines.length < 3) {
      throw new Error('Generated code has too few meaningful lines for ordering exercise');
    }

    // 3. 섞을 라인 수 결정
    const linesToShuffle = calculateLinesToShuffle(meaningfulLines, level);
    console.log(`Will shuffle ${linesToShuffle} lines out of ${meaningfulLines.length}`);

    // 4. 선택된 라인들만 섞기
    const selectedLines = meaningfulLines.slice(0, linesToShuffle);
    const shuffledLines = shuffleArray(selectedLines.map(line => line.content));
    
    // 5. 정답 순서 (원본 순서)
    const correctOrder = selectedLines.map(line => line.content);

    // 6. 문제 설명 생성
    const problemInfo = await generateOrderingDescription({ 
      level, 
      topic, 
      language, 
      code: correctCode 
    });

    // 7. 최종 결과 반환
    const result = {
      title: problemInfo.title,
      description: problemInfo.description,
      instruction: problemInfo.instruction,
      explanation: problemInfo.explanation,
      level,
      topic,
      language,
      type: 'code_ordering',
      correctCode,              // 전체 정답 코드 (참고용)
      shuffledLines,           // 섞인 라인들 (사용자가 정렬할 대상)
      correctOrder,            // 정답 순서 (검증용)
      totalLines: selectedLines.length,
      difficulty: level
    };

    console.log('Code ordering problem generated successfully');
    return result;

  } catch (error) {
    console.error('Error generating code ordering problem:', error);
    throw error;
  }
}

/**
 * 사용자 답안 검증 함수
 */
function validateOrderingAnswer(problem, userOrderedLines) {
  if (!problem || !userOrderedLines) {
    return { isCorrect: false, score: 0, feedback: '잘못된 입력입니다.' };
  }

  const { correctOrder } = problem;
  
  if (userOrderedLines.length !== correctOrder.length) {
    return { 
      isCorrect: false, 
      score: 0, 
      feedback: '라인 개수가 일치하지 않습니다.' 
    };
  }

  // 정확한 순서 매칭 확인
  let correctCount = 0;
  const results = [];

  for (let i = 0; i < correctOrder.length; i++) {
    const userLine = userOrderedLines[i]?.trim();
    const correctLine = correctOrder[i]?.trim();
    const isCorrect = userLine === correctLine;
    
    if (isCorrect) correctCount++;
    
    results.push({
      position: i + 1,
      userLine,
      correctLine,
      isCorrect
    });
  }

  const score = Math.round((correctCount / correctOrder.length) * 100);
  const isCorrect = correctCount === correctOrder.length;

  return {
    isCorrect,
    score,
    correctCount,
    totalLines: correctOrder.length,
    results,
    feedback: isCorrect ? 
      '모든 라인의 순서가 정확합니다!' : 
      `${correctCount}/${correctOrder.length}개의 라인이 올바른 위치에 있습니다.`
  };
}

module.exports = {
  generateCodeOrderingProblem,
  validateOrderingAnswer,
  shuffleArray,
  extractMeaningfulLines,
  calculateLinesToShuffle
};
