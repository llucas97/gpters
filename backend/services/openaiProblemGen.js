'use strict';

if (!global.fetch) {
  global.fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));
}
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL   = process.env.OPENAI_MODEL || 'gpt-4o-mini';

// 디버깅: 환경 변수 확인
console.log('🔍 OPENAI_API_KEY 확인:', OPENAI_API_KEY ? 'Found' : 'Missing');
console.log('🔍 OPENAI_API_KEY 길이:', OPENAI_API_KEY ? OPENAI_API_KEY.length : 0);
console.log('🔍 모든 환경 변수:', Object.keys(process.env).filter(key => key.includes('OPENAI')));

// Cloze 전용 유틸리티 함수들 import
const { 
  enforceLevel0Shape, 
  safeParse, 
  extractFirstJsonLike, 
  normalizeJsPlaceholders,
  enforceClozeShape,
  getBlankCandidates,
  LEVEL2_CANDIDATES,
  LEVEL3_CANDIDATES
} = require('./openaiCloze');

// 블록코딩 전용 함수들 import
const { generateBlockCodingProblem } = require('./openaiBlockCoding');

function placeholderSyntax(language) {
  const lang = String(language || '').toLowerCase();
  
  // Python uses # comments
  if (['py', 'python'].includes(lang)) {
    return { wrap: (n) => `# __${n}__` };
  }
  
  // JavaScript, TypeScript use // comments
  if (['js', 'javascript', 'ts', 'typescript'].includes(lang)) {
    return { wrap: (n) => `// __${n}__` };
  }
  
  // C, C++, Java, C# use /* */ comments
  if (['c', 'cpp', 'c++', 'cxx', 'java', 'cs', 'csharp'].includes(lang)) {
    return { wrap: (n) => `/* __${n}__ */` };
  }
  
  // Default fallback
  return { wrap: (n) => `/* __${n}__ */` };
}

function countPlaceholders(code) {
  return (String(code).match(/__\s*\d+\s*__/g) || []).length;
}

function normalizePlaceholders(code, language, blanksLen) {
  let src = String(code);
  const { wrap } = placeholderSyntax(language);

  if (countPlaceholders(src) === blanksLen) return src;

  const unders = src.match(/_{3,}/g);
  if (unders && unders.length === blanksLen) {
    let i = 1;
    src = src.replace(/_{3,}/g, () => wrap(i++));
    if (countPlaceholders(src) === blanksLen) return src;
  }

  src = src.replace(/(?:<|\[)?\s*BLANK\s*[-_ ]*(\d+)\s*(?:>|\])?/gi, (_, d) => wrap(Number(d)));
  if (countPlaceholders(src) === blanksLen) return src;

  src = src.replace(/__\s*(\d+)\s*__/g, (_, d) => wrap(Number(d)));
  return src;
}

function buildSystemPrompt(language) {
  const { wrap } = placeholderSyntax(language);
  const example = wrap('N').replace('N', 'N');
  return [
    'You are an algorithm problem author for programming contests.',
    'Generate a brand-new ORIGINAL problem (no copyrighted content).',
    'IMPORTANT: Create DIVERSE and UNIQUE problems. Avoid repetitive patterns or common examples.',
    'ALL NATURAL LANGUAGE CONTENT MUST BE IN KOREAN (한국어).',
    'Code identifiers, keywords, and syntax remain in English.',
    `CRITICAL: Use ONLY keywords and syntax appropriate for ${language}. DO NOT mix languages (e.g., no Python 'pass' in JavaScript, no JavaScript 'console' in Python).`,
    'Return STRICT JSON with keys:',
    'title, statement, input_spec, output_spec, constraints, examples, difficulty_level, code_template, blanks.',
    '- title: Korean problem title (한국어 문제 제목)',
    '- statement: Korean problem description (한국어 문제 설명)',
    '- input_spec: Korean input format description (한국어 입력 형식 설명)',
    '- output_spec: Korean output format description (한국어 출력 형식 설명)',
    '- constraints: Korean constraints description (한국어 제약 조건)',
    '- examples: array of {input, output, explanation} where explanation is in Korean (설명은 한국어)',
    '- difficulty_level: integer 1..30.',
    `- code_template: single-file starter code with placeholders EXACTLY as "__N__", using language-appropriate comments; for ${language}, use the form like: ${example}.`,
    '- blanks: array of {id:int, answer:string, hint:string} where hint is in Korean (힌트는 한국어).',
    'BLANK GUIDELINES BY DIFFICULTY:',
    '- Level 0: CRITICAL RULE - Use EXACTLY 2 blanks. Each blank must be ONE SINGLE WORD only (examples: x, y, let, const, +, -, console, log). NEVER use phrases like "fruit.quantity" or "if (condition)" or "totalFruits += fruit.quantity". ONLY simple words like "let" or "x" or "+".',
    '- Level 1: Use EXACTLY 3 blanks, each blank must be ONE SINGLE WORD only (like: x, +, print, if, for). NO phrases, NO expressions, ONLY individual words.',
    '- Level 3: Use EXACTLY 1 blank, focus on meaningful programming keywords and methods (like "length", "map", "sum", "result").',
    '- Level 4: Use EXACTLY 2 blanks, focus on meaningful programming keywords and methods (like "filter", "push", "response", "data").',
    '- Level 5: Use EXACTLY 3 blanks, focus on meaningful programming keywords and methods (like "querySelector", "addEventListener", "fetch", "then").',
    '- Level 6-15: Use 3-4 blanks, mix of single words and short expressions',
    '- Level 16-25: Use 4-6 blanks, include longer expressions and logic',
    '- Level 26-30: Use 5-8 blanks, complex expressions and advanced concepts',
    'NO markdown, NO backticks. Return valid JSON only.',
    'Ensure the number of placeholders in code_template EQUALS blanks.length. Strictly follow the format.',
    'Remember: All descriptions, explanations, and hints must be in Korean, but code syntax stays English.',
  ].join(' ');
}

function userPayload({ level, topic, language }) {
  let blankGuidance = '';
  
  // 언어별 적절한 키워드 예시 제공
  let langExamples = '';
  if (language === 'python') {
    langExamples = 'Python examples: x, y, +, -, *, print, input, if, for, while, def, return';
  } else if (language === 'javascript') {
    langExamples = 'JavaScript examples: x, y, +, -, *, console, let, const, if, for, while, function, return';
  } else if (language === 'java') {
    langExamples = 'Java examples: x, y, +, -, *, System, int, String, if, for, while, public, return';
  } else if (language === 'cpp' || language === 'c++') {
    langExamples = 'C++ examples: x, y, +, -, *, cout, cin, int, if, for, while, return';
  } else if (language === 'c') {
    langExamples = 'C examples: x, y, +, -, *, printf, scanf, int, if, for, while, return';
  } else {
    langExamples = 'Examples: x, y, +, -, *, if, for, while, return';
  }

  if (level === 0) {
    blankGuidance = `CRITICAL: Use EXACTLY 2 blanks - not 1, not 3, EXACTLY 2! Each blank must be ONE SINGLE WORD ONLY appropriate for ${language}. Examples of VALID ${language} words: ${langExamples}. DO NOT use keywords from other languages (no Python 'pass' in JavaScript, no JavaScript 'console' in Python). Examples of INVALID: "fruit.quantity", "if (N >= fruit.price)", "totalFruits += fruit.quantity". ONLY use ONE WORD per blank like "let", "x", "+", "console", "log". Create the SIMPLEST possible ${language} problem with exactly 2 single-word blanks.`;
  } else if (level === 1) {
    blankGuidance = `Use EXACTLY 3 blanks. Each blank must be ONE SINGLE WORD ONLY (${langExamples}). NO phrases like "x + 1" or "print(x)". ONLY individual words appropriate for ${language}. Create slightly more complex problems than level 0.`;
  } else if (level === 3) {
    blankGuidance = `Use EXACTLY 1 blank. Focus on meaningful programming keywords and methods (like "length", "map", "sum", "result"). Create problems that teach core programming concepts through key identifiers.`;
  } else if (level === 4) {
    blankGuidance = `Use EXACTLY 2 blanks. Focus on meaningful programming keywords and methods (like "filter", "push", "response", "data"). Prefer method chaining patterns when possible (object.method). Create problems that teach core programming concepts.`;
  } else if (level === 5) {
    blankGuidance = `Use EXACTLY 3 blanks. Focus on meaningful programming keywords and methods (like "querySelector", "addEventListener", "fetch", "then"). Create problems involving loops, conditionals, or multi-step algorithms.`;
  } else if (level <= 15) {
    blankGuidance = 'Use 3-4 blanks with mix of single words and short expressions.';
  } else if (level <= 25) {
    blankGuidance = 'Use 4-6 blanks including longer expressions and logic components.';
  } else {
    blankGuidance = 'Use 5-8 blanks with complex expressions and advanced programming concepts.';
  }
  
  return JSON.stringify({
    level, topic, language,
    instruction: `Create minimal, self-contained starter code with placeholders for key expressions/lines. Generate all natural language content (title, description, explanations, hints) in Korean (한국어). Keep code syntax and identifiers in English. ${blankGuidance}`
  });
}

async function generateProblem({ level = 10, topic = 'graph', language = 'python', recentTitles = [], problemType = 'cloze' }) {
  console.log(`[DEBUG] generateProblem 호출됨 - 레벨: ${level}, problemType: ${problemType}`);
  
  if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY missing');

  // 레벨 3-5는 특화된 generateCloze 함수 사용 (키워드/메소드 방식)
  if (level >= 3 && level <= 5) {
    console.log(`[DEBUG] Level ${level} detected - using specialized generateCloze function`);
    return await generateCloze({ level, topic, language, locale: 'ko' });
  }

  console.log(`[DEBUG] Level ${level} detected - using regular cloze generation`);

  const system = buildSystemPrompt(language);
  
  // 다양성을 위한 랜덤 시드 추가
  const randomSeed = Math.floor(Math.random() * 1000000);
  let diversityPrompt = `Generate a UNIQUE and CREATIVE problem. Avoid common textbook examples. Random seed: ${randomSeed}`;
  
  // 최근 문제 제목들이 있으면 중복 방지 지시문 추가
  if (recentTitles.length > 0) {
    diversityPrompt += ` AVOID creating problems similar to these recent titles: ${recentTitles.join(', ')}. Create something completely different.`;
  }
  
  const body = {
    model: OPENAI_MODEL,
    messages: [
      { role: 'system', content: system },
      { role: 'user',   content: userPayload({ level, topic, language }) + ' ' + diversityPrompt },
    ],
    temperature: 0.7, // 더 다양한 결과를 위해 증가
    response_format: { type: 'json_object' },
  };

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_API_KEY}` },
    body: JSON.stringify(body)
  });

  const raw = await res.text();
  if (!res.ok) throw new Error(`OpenAI ${res.status}\n${raw}`);

  let data;
  try {
    data = JSON.parse(JSON.parse(raw)?.choices?.[0]?.message?.content || '{}');
  } catch {
    throw new Error(`Invalid JSON from model\n${raw.slice(0, 200)}`);
  }

  const must = ['title','statement','input_spec','output_spec','examples','difficulty_level','code_template','blanks'];
  for (const k of must) if (!(k in data)) throw new Error(`missing field: ${k}`);
  if (!Array.isArray(data.examples) || !Array.isArray(data.blanks)) throw new Error('examples/blanks must be arrays');
  
  // 레벨별 블록 개수 강제 검증
  // 레벨 0-2는 블록코딩 시스템을 사용하므로 여기서는 검증하지 않음
  if (level === 0 && data.blanks.length !== 2) {
    throw new Error(`Level 0 must have exactly 2 blanks, got ${data.blanks.length}`);
  } else if (level === 1 && data.blanks.length !== 3) {
    throw new Error(`Level 1 must have exactly 3 blanks, got ${data.blanks.length}`);
  } else if (level === 3 && data.blanks.length !== 1) {
    throw new Error(`Level 3 must have exactly 1 blank, got ${data.blanks.length}`);
  } else if (level === 4 && data.blanks.length !== 2) {
    throw new Error(`Level 4 must have exactly 2 blanks, got ${data.blanks.length}`);
  } else if (level === 5 && data.blanks.length !== 3) {
    throw new Error(`Level 5 must have exactly 3 blanks, got ${data.blanks.length}`);
  }

  data.blanks = data.blanks.map((b, i) => {
    const n = Number(String(b.id ?? (i + 1)).toString().replace(/\D/g, '')) || (i + 1);
    let answer = String(b.answer ?? '').trim();
    
    // 레벨 0-1에서는 단어가 단일 단어인지 검증, 레벨 3-5는 키워드/메소드 허용
    // 레벨 2는 블록코딩 시스템 사용
    if (level <= 1) {
      // 공백, 특수문자, 괄호 등이 포함되어 있으면 첫 번째 단어만 추출
      const singleWord = answer.split(/[\s\(\)\[\]\{\}\+\-\*\/\=\<\>\!\&\|\,\.]+/)[0];
      if (singleWord && singleWord !== answer) {
        console.log(`Level ${level}: Converting "${answer}" to single word "${singleWord}"`);
        answer = singleWord;
      }
      
      // 레벨 0-1에서는 특히 엄격하게 검증
      if (level <= 1) {
        // 언어별 허용된 단어만 사용
        let allowedWords = [];
        if (language === 'javascript') {
          allowedWords = ['let', 'const', 'var', 'x', 'y', 'z', 'a', 'b', 'console', 'log', 'if', 'for', 'while', 'function', '+', '-', '*', '/', '='];
        } else if (language === 'python') {
          allowedWords = ['x', 'y', 'z', 'a', 'b', 'print', 'input', 'if', 'for', 'while', 'def', 'return', '+', '-', '*', '/', '='];
        } else {
          allowedWords = ['x', 'y', 'z', 'a', 'b', 'if', 'for', 'while', '+', '-', '*', '/', '='];
        }
        
        // 15자 이상이거나 허용되지 않은 단어면 교체
        if (answer.length > 15 || !allowedWords.includes(answer.toLowerCase())) {
          answer = allowedWords[i % allowedWords.length];
          console.log(`Level 0: Replacing with language-appropriate "${answer}"`);
        }
      }
    }
    
    return { id: n, answer, hint: String(b.hint ?? '') };
  });

  let code = String(data.code_template || '');
  code = normalizePlaceholders(code, language, data.blanks.length);
  const phCount = countPlaceholders(code);
  
  // placeholder와 blanks 개수가 맞지 않을 때 조정
  if (phCount !== data.blanks.length) {
    console.warn(`Placeholder count mismatch: placeholders(${phCount}) != blanks(${data.blanks.length})`);
    
    if (phCount > data.blanks.length) {
      // placeholder가 더 많으면 blanks를 추가
      const needed = phCount - data.blanks.length;
      for (let i = 0; i < needed; i++) {
        data.blanks.push({
          id: data.blanks.length + i + 1,
          answer: '???',
          hint: '빈칸을 채우세요'
        });
      }
    } else if (phCount < data.blanks.length) {
      // blanks가 더 많으면 blanks를 줄임
      data.blanks = data.blanks.slice(0, phCount);
    }
    
    // 여전히 0개라면 최소 1개는 만들기
    if (phCount === 0 && data.blanks.length === 0) {
      code = code + '\n# __1__ # Complete this line';
      data.blanks = [{ id: 1, answer: 'pass', hint: '구현을 완성하세요' }];
    }
  }

  return {
    title: String(data.title || '').slice(0, 255),
    statement: String(data.statement || ''),
    input_spec: String(data.input_spec || ''),
    output_spec: String(data.output_spec || ''),
    constraints: String(data.constraints || ''),
    examples: data.examples,
    level: Number(data.difficulty_level || level) || level,
    language,
    topic,
    code,
    blanks: data.blanks
  };
}


async function generateCloze({ level, topic, language, locale }) {
  console.log(`[DEBUG] generateCloze 함수 시작 - level: ${level}, topic: ${topic}, language: ${language}`);
  
  if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY missing');

  const isKorean = (locale || process.env.PROBLEM_LOCALE || 'ko').toLowerCase().startsWith('ko');
  const progLang = (language || 'python').toLowerCase();

  // 레벨별 블랭크 후보 목록 가져오기
  const candidates = getBlankCandidates(level);
  
  // 레벨별 블랭크 개수 및 가이드
  const blankConfig = {
    3: { count: 1, desc: '1 meaningful keyword/method' },
    4: { count: 2, desc: '2 meaningful keywords/methods' },
    5: { count: 3, desc: '3 meaningful keywords/methods' }
  };
  const config = blankConfig[level] || blankConfig[3];
  
  // 레벨 3~5에 맞는 시스템 프롬프트
  const sys = [
    `You are an algorithm problem generator for Level ${level} problems. Return a SINGLE JSON object and nothing else.`,
    "Do NOT include Markdown fences, comments, or extra prose.",
    // 서술 언어
    isKorean
      ? "All natural-language fields (title, statement, input_spec, output_spec, constraints, examples[].explanation) MUST be in Korean."
      : "All natural-language fields MUST be in English.",
    "",
    // 레벨별 핵심 규칙
    `CRITICAL: Level ${level} requires EXACTLY ${config.count} blank(s) focusing on meaningful programming keywords/methods.`,
    "Create blanks for essential methods (.length, .map, .push), properties (.value, .innerHTML), key variables (sum, result, count), or important keywords.",
    "Each blank should represent a meaningful programming concept that helps learning.",
    "",
    // 플레이스홀더 규칙 (중요!)
    `In field \`code\`, insert placeholders as plain tokens like __1__, __2__, __3__.`,
    `CRITICAL: Each placeholder MUST appear EXACTLY ONCE in the code. Do NOT reuse the same placeholder number.`,
    `For example: If you use __1__, it should appear only once in the entire code.`,
    "Placeholders MUST NOT appear inside quotes or comments.",
    "Keep code identifiers/keywords in English.",
    progLang === 'javascript'
      ? "For JavaScript code, use Node.js-compatible ES2015 syntax. Avoid top-level await. No HTML or browser-only APIs."
      : ""
  ].filter(Boolean).join('\n');

  const user = [
    `topic: ${topic}`,
    `level: ${level}`,
    `programming_language: ${progLang}`,
    `narrative_language: ${isKorean ? 'Korean' : 'English'}`,
    "",
    `Create a Level ${level} algorithm problem with EXACTLY ${config.count} meaningful blank(s).`,
    `Each placeholder (__1__, __2__, __3__) must appear EXACTLY ONCE in the code.`,
    "Focus on core algorithmic concepts like loops, conditionals, and data manipulation.",
    "",
    "Blank target examples:",
    `- Use meaningful keywords like: ${candidates.slice(0, 15).join(', ')}, etc.`,
    `- Focus on methods, properties, variables, or important programming concepts.`,
    "",
    // 스키마 설명
    "Return strict JSON with fields:",
    "{",
    '  "title": string,',
    '  "statement": string,',
    '  "input_spec": string,',
    '  "output_spec": string,',
    '  "constraints": string?,',
    '  "examples": [{"input": string, "output": string, "explanation": string?}][],',
    '  "code": string,',
    '  "blanks": [{"id": number, "hint": string?, "answer": string?}]',
    "}",
    "Strings must be JSON-escaped. No trailing commas."
  ].join('\n');
  
  const body = {
    model: OPENAI_MODEL,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: sys },
      { role: 'user', content: user }
    ],
    temperature: 0.5
  };

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_API_KEY}` },
    body: JSON.stringify(body)
  });

  const raw = await res.text();
  if (!res.ok) throw new Error(`OpenAI ${res.status}\n${raw}`);

  const rawContent = JSON.parse(raw)?.choices?.[0]?.message?.content ?? "{}";
  const rawText = extractFirstJsonLike(rawContent);
  let parsed = safeParse(rawText);
  if (!parsed) throw new Error('OpenAI response not parseable');

  // 레벨별 보정
  parsed = enforceClozeShape(parsed, Number(level));

  // level, topic, language 필드 추가 (데이터베이스 저장을 위해 필수)
  const result = {
    ...parsed,
    level: Number(level),
    topic: String(topic),
    language: String(language)
  };
  
  console.log(`[DEBUG] generateCloze 반환값:`, JSON.stringify(result, null, 2));
  
  return result;
}

module.exports = { generateProblem, generateCloze };
