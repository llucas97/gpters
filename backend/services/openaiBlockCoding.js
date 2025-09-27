'use strict';

if (!global.fetch) {
  global.fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));
}

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

/**
 * 레벨 0~1 블록코딩 문제 생성기
 * 정답 코드를 기반으로 블랭크와 정답 블록을 한 쌍(pair)으로 만들어 동시에 생성
 */

// 언어별 키워드 후보 리스트
const KEYWORD_CANDIDATES = {
  javascript: [
    // 변수 선언
    'let', 'const', 'var',
    // 함수 관련
    'function', 'return',
    // 제어문
    'if', 'else', 'for', 'while',
    // 출력
    'console', 'log',
    // 연산자
    '+', '-', '*', '/', '=',
    // 변수명 (간단한 것들)
    'x', 'y', 'z', 'a', 'b', 'i', 'j', 'sum', 'count'
  ],
  python: [
    // 변수 선언 (Python은 암시적)
    // 함수 관련
    'def', 'return',
    // 제어문
    'if', 'else', 'for', 'while',
    // 출력
    'print',
    // 연산자
    '+', '-', '*', '/', '=',
    // 변수명 (간단한 것들)
    'x', 'y', 'z', 'a', 'b', 'i', 'j', 'sum', 'count'
  ],
  java: [
    // 변수 선언
    'int', 'String', 'double',
    // 함수 관련
    'public', 'static', 'void', 'return',
    // 제어문
    'if', 'else', 'for', 'while',
    // 출력
    'System', 'out', 'println',
    // 연산자
    '+', '-', '*', '/', '=',
    // 변수명
    'x', 'y', 'z', 'a', 'b', 'i', 'j', 'sum', 'count'
  ]
};

/**
 * 정답 코드에서 키워드 후보를 찾아 반환
 */
function extractKeywordCandidates(code, language) {
  const candidates = KEYWORD_CANDIDATES[language] || KEYWORD_CANDIDATES.javascript;
  const foundKeywords = [];
  
  // 코드를 단어 단위로 분리하여 키워드 후보와 매칭
  const words = code.split(/\s+/);
  
  for (const word of words) {
    const cleanWord = word.replace(/[^\w\+\-\*\/\=]/g, ''); // 특수문자 제거
    if (candidates.includes(cleanWord)) {
      foundKeywords.push(cleanWord);
    }
  }
  
  return [...new Set(foundKeywords)]; // 중복 제거
}

/**
 * 레벨별 블랭크 개수 결정
 */
function getBlankCount(level) {
  if (level === 0) return 1;
  if (level === 1) return 2;
  return Math.min(Math.max(2, Math.floor(level / 5)), 6); // 2~6개
}

/**
 * 랜덤하게 N개의 키워드를 선택
 */
function selectRandomKeywords(keywords, count) {
  if (keywords.length <= count) return keywords;
  
  const shuffled = [...keywords].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * 오답 블록(distractor) 생성
 */
function generateDistractors(correctAnswers, language, count = 3) {
  const candidates = KEYWORD_CANDIDATES[language] || KEYWORD_CANDIDATES.javascript;
  const distractors = [];
  
  // 정답이 아닌 키워드들을 선택
  const wrongAnswers = candidates.filter(word => !correctAnswers.includes(word));
  
  // 랜덤하게 선택하되, 정답과 유사한 난이도의 키워드 우선 선택
  const shuffled = [...wrongAnswers].sort(() => Math.random() - 0.5);
  
  for (let i = 0; i < count && i < shuffled.length; i++) {
    distractors.push(shuffled[i]);
  }
  
  return distractors;
}

/**
 * 정답 코드를 블랭크가 포함된 코드로 변환
 */
function createBlankedCode(originalCode, keywordsToBlank) {
  let blankedCode = originalCode;
  
  keywordsToBlank.forEach((keyword, index) => {
    const placeholder = `BLANK_${index + 1}`;
    // 단어 경계를 고려하여 정확히 매칭
    const regex = new RegExp(`\\b${keyword}\\b`, 'g');
    blankedCode = blankedCode.replace(regex, placeholder);
  });
  
  return blankedCode;
}

/**
 * 블록 데이터 생성 (정답 블록 + 오답 블록)
 */
function createBlockData(keywordsToBlank, language) {
  const blocks = [];
  
  // 정답 블록들
  keywordsToBlank.forEach((keyword, index) => {
    blocks.push({
      id: `answer_${index + 1}`,
      text: keyword,
      type: 'answer',
      blankId: index + 1
    });
  });
  
  // 오답 블록들
  const distractors = generateDistractors(keywordsToBlank, language, 3);
  distractors.forEach((distractor, index) => {
    blocks.push({
      id: `distractor_${index + 1}`,
      text: distractor,
      type: 'distractor'
    });
  });
  
  // 블록들을 랜덤하게 섞기
  return blocks.sort(() => Math.random() - 0.5);
}

/**
 * OpenAI API를 통해 완전한 정답 코드 생성
 */
async function generateCompleteCode({ level, topic, language }) {
  if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY missing');

  const systemPrompt = [
    'You are a programming problem generator for block coding exercises.',
    'Generate a simple, complete working code solution for the given level and topic.',
    'The code should be educational and appropriate for beginners.',
    `Use ${language} syntax and best practices.`,
    'Return ONLY the code, no explanations or markdown.',
    'Keep the code simple and focused on the core concept.',
    'Use meaningful variable names but keep them simple (x, y, sum, count, etc.).',
    'Include basic programming concepts like variables, simple operations, and basic control flow if appropriate for the level.'
  ].join(' ');

  const userPrompt = `Generate a complete working ${language} code for:
Level: ${level}
Topic: ${topic}

Requirements:
- Simple and educational
- Complete working solution
- Use basic programming concepts appropriate for level ${level}
- Keep it short and focused (10-20 lines maximum)
- Return only the code, no explanations`;

  const body = {
    model: OPENAI_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.7,
    max_tokens: 500
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
async function generateProblemDescription({ level, topic, language, code }) {
  if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY missing');

  const systemPrompt = [
    'You are a programming education assistant.',
    'Generate problem description and examples in Korean.',
    'Make it appropriate for the given level and topic.',
    'Keep explanations simple and clear for beginners.'
  ].join(' ');

  const userPrompt = `Create a problem description for this ${language} code:
${code}

Level: ${level}
Topic: ${topic}

Return JSON format:
{
  "title": "문제 제목 (한국어)",
  "description": "문제 설명 (한국어)",
  "instruction": "블록을 드래그하여 빈칸을 채우세요 (한국어)"
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
 * 메인 블록코딩 문제 생성 함수
 */
async function generateBlockCodingProblem({ level = 0, topic = 'basic', language = 'javascript' }) {
  try {
    console.log(`Generating block coding problem: Level ${level}, Topic: ${topic}, Language: ${language}`);

    // 1. 완전한 정답 코드 생성
    const completeCode = await generateCompleteCode({ level, topic, language });
    console.log('Complete code generated:', completeCode);

    // 2. 키워드 후보 선정
    const keywordCandidates = extractKeywordCandidates(completeCode, language);
    console.log('Keyword candidates found:', keywordCandidates);

    if (keywordCandidates.length === 0) {
      throw new Error('No suitable keywords found in the generated code');
    }

    // 3. 레벨별 블랭크 개수에 맞게 키워드 선택
    const blankCount = getBlankCount(level);
    const keywordsToBlank = selectRandomKeywords(keywordCandidates, blankCount);
    console.log(`Selected ${blankCount} keywords to blank:`, keywordsToBlank);

    // 4. 블랭크가 포함된 코드 생성
    const blankedCode = createBlankedCode(completeCode, keywordsToBlank);
    console.log('Blanked code:', blankedCode);

    // 5. 블록 데이터 생성 (정답 + 오답)
    const blocks = createBlockData(keywordsToBlank, language);
    console.log('Blocks created:', blocks);

    // 6. 문제 설명 생성
    const problemInfo = await generateProblemDescription({ level, topic, language, code: completeCode });

    // 7. 최종 결과 반환
    const result = {
      title: problemInfo.title,
      description: problemInfo.description,
      instruction: problemInfo.instruction,
      level,
      topic,
      language,
      completeCode, // 정답 코드 (참고용)
      blankedCode,  // 블랭크가 포함된 코드
      blocks,       // 드래그할 블록들
      blankCount,   // 블랭크 개수
      keywordsToBlank // 선택된 키워드들
    };

    console.log('Block coding problem generated successfully');
    return result;

  } catch (error) {
    console.error('Error generating block coding problem:', error);
    throw error;
  }
}

module.exports = {
  generateBlockCodingProblem,
  extractKeywordCandidates,
  getBlankCount,
  selectRandomKeywords,
  generateDistractors,
  createBlankedCode,
  createBlockData
};
