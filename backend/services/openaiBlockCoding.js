/*
backend/services/openaiBlockCoding.js - OpenAI로 블록코딩 문제 생성
완전한 코드를 생성하고, 핵심 키워드를 블랭크(BLANK_1, BLANK_2 등)로 치환
정답 블록 + 오답 블록(distractors)을 함께 생성
드래그 앤 드롭으로 채울 수 있게 블록 데이터 제공
*/

'use strict';

if (!global.fetch) {
  global.fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));
}

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

// === Cloze 전용 유틸리티 함수들 ===
const JSON5 = require('json5');

function extractFirstJsonLike(text='') {
  // ```json ... ``` 안쪽 또는 가장 바깥 { ... } 추출
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) return fence[1].trim();
  const first = text.indexOf('{');
  const last  = text.lastIndexOf('}');
  if (first !== -1 && last !== -1 && last > first) return text.slice(first, last+1);
  return text.trim();
}

function safeParse(text='') {
  try { return JSON.parse(text); } catch { /* noop */ }
  try { return JSON5.parse(text); } catch { /* noop */ }
  // 흔한 노이즈 제거 후 재시도
  let t = text
    .replace(/^[^\{\[]+/, '')               // 앞쪽 잡다한 문구 제거
    .replace(/```[\s\S]*?```/g, '')         // 코드펜스 제거
    .replace(/,\s*([}\]])/g, '$1')          // 트레일링 콤마 제거
    .trim();
  try { return JSON.parse(t); } catch { /* noop */ }
  try { return JSON5.parse(t); } catch { /* noop */ }
  return null;
}

// JS 코드에 섞인 주석형 플레이스홀더를 실제 토큰으로 정리
function normalizeJsPlaceholders(code='') {
  return code
    .replace(/\/\*\s*__\s*(\d+)\s*__\s*\*\//g, '__$1__')
    .replace(/\/\/\s*__\s*(\d+)\s*__/g, '__$1__');
}

// 레벨0: 2칸·1단어 토큰 강제(이전 안내대로)
function sanitizeSingleWordToken(s) {
  if (!s) return null;
  const first = String(s).trim().split(/\s+/)[0];
  let t = first.normalize('NFKC').replace(/[^A-Za-z0-9_]/g,'_').replace(/_+/g,'_').replace(/^_+|_+$/g,'');
  return (t || 'val').toLowerCase();
}

function extractPlaceholderIds(code) {
  const out = new Set(); const re = /__\s*(\d+)\s*__/g; let m;
  while ((m = re.exec(code)) !== null) out.add(Number(m[1]));
  return Array.from(out).sort((a,b)=>a-b);
}

function replacePlaceholder(code, id, rep) {
  return code.replace(new RegExp(`__\\s*${id}\\s*__`,'g'), rep);
}

function enforceLevel0Shape(result) {
  if (!result || typeof result !== 'object') return result;
  let { code = '', blanks = [] } = result;
  const ids = extractPlaceholderIds(code);
  const map = new Map();
  for (const b of (blanks||[])) {
    const id = Number(String(b?.id ?? b).replace(/\D/g,''));
    if (!id) continue;
    const ans = sanitizeSingleWordToken(b?.answer ?? b?.value ?? '');
    if (ans) map.set(id, ans);
  }
  for (const id of ids) {
    if (id === 1 || id === 2) continue;
    code = replacePlaceholder(code, id, map.get(id) || 'x');
  }
  for (const k of [1,2]) {
    if (!new RegExp(`__\\s*${k}\\s*__`).test(code)) {
      code = code.replace(/\b([A-Za-z_][A-Za-z0-9_]*)\b/, `__${k}__`);
    }
  }
  const ans1 = sanitizeSingleWordToken(map.get(1) || 'n');
  const ans2 = sanitizeSingleWordToken(map.get(2) || 'arr');
  return { ...result, code, blanks: [{id:1,hint:'간단한 식별자 1',answer:ans1},{id:2,hint:'간단한 식별자 2',answer:ans2}] };
}

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
  
  const uniqueKeywords = [...new Set(foundKeywords)]; // 중복 제거
  
  // 키워드가 부족하면 기본 키워드 추가
  if (uniqueKeywords.length < 2) {
    const defaultKeywords = candidates.slice(0, 5); // 기본 키워드 5개
    for (const defaultKeyword of defaultKeywords) {
      if (!uniqueKeywords.includes(defaultKeyword)) {
        uniqueKeywords.push(defaultKeyword);
      }
    }
  }
  
  return uniqueKeywords;
}

/**
 * 레벨별 블랭크 개수 결정
 */
function getBlankCount(level) {
  if (level === 0) return 1;
  if (level === 1) return 2;
  if (level === 2) return 3;
  return Math.min(Math.max(2, Math.floor(level / 5)), 6); // 2~6개
}

/**
 * 랜덤하게 N개의 키워드를 선택
 */
function selectRandomKeywords(keywords, count) {
  if (keywords.length <= count) {
    // 키워드가 부족하면 기본 키워드로 보충
    const language = 'javascript'; // 기본값
    const candidates = KEYWORD_CANDIDATES[language];
    const additionalKeywords = candidates.filter(word => !keywords.includes(word));
    
    while (keywords.length < count && additionalKeywords.length > 0) {
      keywords.push(additionalKeywords.shift());
    }
    
    return keywords;
  }
  
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
 * 각 키워드가 여러 번 나타나면 랜덤하게 하나만 블랭크로 처리
 * 반환값: { blankedCode, blankMappings } - 블랭크 코드와 키워드 매핑 정보
 */
function createBlankedCode(originalCode, keywordsToBlank) {
  // 원본 코드를 기반으로 모든 키워드의 위치를 먼저 찾기
  const allKeywordPositions = new Map(); // keyword -> [positions]
  
  keywordsToBlank.forEach((keyword) => {
    if (!allKeywordPositions.has(keyword)) {
      const positions = [];
      const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const isSpecialChar = /^[+\-*/=]$/.test(keyword);
      const regex = isSpecialChar 
        ? new RegExp(escapedKeyword, 'g')
        : new RegExp(`\\b${escapedKeyword}\\b`, 'g');
      
      let match;
      // 원본 코드에서 모든 매칭 찾기 (lastIndex 초기화를 위해 새 RegExp 사용)
      const regexCopy = isSpecialChar
        ? new RegExp(escapedKeyword, 'g')
        : new RegExp(`\\b${escapedKeyword}\\b`, 'g');
      
      while ((match = regexCopy.exec(originalCode)) !== null) {
        positions.push({
          index: match.index,
          length: match[0].length,
          keyword: keyword
        });
      }
      
      allKeywordPositions.set(keyword, positions);
      console.log(`[createBlankedCode] 키워드 "${keyword}": ${positions.length}개 발견`, positions);
    }
  });
  
  // 각 키워드에 대해 랜덤으로 하나의 위치 선택
  const selectedPositions = [];
  keywordsToBlank.forEach((keyword, index) => {
    const positions = allKeywordPositions.get(keyword) || [];
    
    if (positions.length === 0) {
      console.warn(`[createBlankedCode] 키워드 "${keyword}"가 코드에서 찾을 수 없습니다.`);
      return;
    }
    
    // 랜덤하게 하나 선택
    const randomIndex = Math.floor(Math.random() * positions.length);
    const selectedPosition = {
      ...positions[randomIndex],
      blankId: index + 1,
      keyword: keyword
    };
    
    console.log(`[createBlankedCode] BLANK_${index + 1} 선택: 키워드 "${keyword}" (${positions.length}개 중 ${randomIndex + 1}번째, 위치: ${selectedPosition.index})`);
    
    selectedPositions.push(selectedPosition);
  });
  
  // 위치 순서대로 정렬 (뒤에서부터 교체하여 인덱스 변경 방지)
  selectedPositions.sort((a, b) => b.index - a.index);
  
  // 뒤에서부터 교체하여 인덱스 변경 영향을 받지 않도록 처리
  let blankedCode = originalCode;
  const blankMappings = [];
  
  selectedPositions.forEach((position) => {
    const placeholder = `BLANK_${position.blankId}`;
    
    // 뒤에서부터 교체
    blankedCode = 
      blankedCode.slice(0, position.index) + 
      placeholder + 
      blankedCode.slice(position.index + position.length);
    
    // 매핑 정보 저장 (빈칸 ID 순서대로)
    blankMappings.push({
      blankId: position.blankId,
      keyword: position.keyword,
      originalIndex: position.index,
      originalLength: position.length,
      placeholder: placeholder
    });
  });
  
  // blankMappings를 blankId 순서대로 정렬
  blankMappings.sort((a, b) => a.blankId - b.blankId);
  
  // 최종 매핑 검증 로그
  console.log('[createBlankedCode] 최종 blankMappings:', blankMappings.map(m => ({
    blankId: m.blankId,
    keyword: m.keyword,
    originalIndex: m.originalIndex
  })));
  console.log('[createBlankedCode] keywordsToBlank 배열:', keywordsToBlank);
  
  // 검증: blankMappings와 keywordsToBlank가 일치하는지 확인
  const mappingMatch = blankMappings.every((mapping, idx) => {
    const expectedKeyword = keywordsToBlank[idx];
    const actualKeyword = mapping.keyword;
    const match = expectedKeyword === actualKeyword;
    if (!match) {
      console.error(`[createBlankedCode] 매핑 불일치! BLANK_${mapping.blankId}: keywordsToBlank[${idx}]="${expectedKeyword}" != blankMappings.keyword="${actualKeyword}"`);
    }
    return match;
  });
  
  if (!mappingMatch) {
    console.error('[createBlankedCode] ⚠️ 경고: blankMappings와 keywordsToBlank가 일치하지 않습니다!');
  }
  
  return { 
    blankedCode, 
    blankMappings, // BLANK_ID -> keyword 매핑 정보 (채점 시 사용)
    keywordsToBlank // 정답 배열 (BLANK_1, BLANK_2, ... 순서대로)
  };
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
    let blankCount = getBlankCount(level);
    
    // 레벨 0, 1, 2에 대한 엄격한 검증
    if (level === 0 && blankCount !== 1) {
      console.warn(`Level 0 must have exactly 1 blank, but got ${blankCount}. Forcing to 1.`);
      blankCount = 1;
    } else if (level === 1 && blankCount !== 2) {
      console.warn(`Level 1 must have exactly 2 blanks, but got ${blankCount}. Forcing to 2.`);
      blankCount = 2;
    } else if (level === 2 && blankCount !== 3) {
      console.warn(`Level 2 must have exactly 3 blanks, but got ${blankCount}. Forcing to 3.`);
      blankCount = 3;
    }
    
    const keywordsToBlank = selectRandomKeywords(keywordCandidates, blankCount);
    console.log(`Selected ${blankCount} keywords to blank:`, keywordsToBlank);
    
    // 최종 검증: 선택된 키워드 개수가 요구된 블랭크 개수와 일치하는지 확인
    if (keywordsToBlank.length !== blankCount) {
      console.warn(`Keyword count mismatch: expected ${blankCount}, got ${keywordsToBlank.length}`);
      // 부족한 키워드를 기본 키워드로 보충
      const candidates = KEYWORD_CANDIDATES[language] || KEYWORD_CANDIDATES.javascript;
      while (keywordsToBlank.length < blankCount) {
        const additionalKeyword = candidates.find(word => !keywordsToBlank.includes(word));
        if (additionalKeyword) {
          keywordsToBlank.push(additionalKeyword);
        } else {
          break;
        }
      }
    }

    // 4. 블랭크가 포함된 코드 생성 (매핑 정보 포함)
    const blankResult = createBlankedCode(completeCode, keywordsToBlank);
    const blankedCode = blankResult.blankedCode;
    const blankMappings = blankResult.blankMappings;
    console.log('Blanked code:', blankedCode);
    console.log('Blank mappings:', blankMappings);

    // 5. 블록 데이터 생성 (정답 + 오답)
    const blocks = createBlockData(keywordsToBlank, language);
    console.log('Blocks created:', blocks);

    // 6. 문제 설명 생성
    const problemInfo = await generateProblemDescription({ level, topic, language, code: completeCode });

    // 7. 최종 결과 반환 (매핑 정보 포함)
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
      keywordsToBlank, // 선택된 키워드들 (BLANK_1, BLANK_2, ... 순서대로 정답)
      blankMappings // BLANK_ID -> keyword 매핑 정보 (채점 시 사용)
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
  createBlockData,
  // Cloze 전용 유틸리티 함수들
  enforceLevel0Shape,
  safeParse,
  extractFirstJsonLike,
  normalizeJsPlaceholders,
  sanitizeSingleWordToken,
  extractPlaceholderIds,
  replacePlaceholder
};
