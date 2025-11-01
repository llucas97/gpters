/*
backend/services/openaiCloze.js - Cloze 문제 생성 (레벨 3-5)
레벨 3: 1개의 핵심 키워드/메소드 블랭크
레벨 4: 2개의 연관된 키워드/메소드 블랭크 (메소드 체이닝 우선)
레벨 5: 3개의 연관된 키워드/메소드 블랭크 (메소드 체이닝 우선)
코드에서 의미있는 키워드를 자동으로 찾아 블랭크 생성
각 플레이스홀더(__1__, __2__, __3__)는 코드에서 정확히 한 번만 사용
*/

'use strict';

if (!global.fetch) {
  global.fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));
}

// === 레벨별 블랭크 후보 목록 정의 ===

// 레벨 3: 핵심 기능을 담당하는 메소드, 속성, 주요 변수명 (1개)
const LEVEL3_BASE_CANDIDATES = [
  // 배열 메소드
  'length', 'map', 'filter', 'reduce', 'push', 'pop', 'sort', 
  'find', 'findIndex', 'slice', 'splice', 'includes', 'join',
  'forEach', 'some', 'every', 'indexOf', 'lastIndexOf',
  
  // 문자열 메소드
  'charAt', 'substring', 'substr', 'split', 'replace', 'trim',
  'toLowerCase', 'toUpperCase', 'startsWith', 'endsWith',
  
  // 객체 속성
  'value', 'innerHTML', 'textContent', 'innerText', 'style',
  'className', 'id', 'name', 'type', 'src', 'href',
  
  // 주요 변수명
  'sum', 'result', 'count', 'index', 'total', 'item', 'data',
  'response', 'json', 'error', 'message', 'status', 'code',
  
  // 수학/계산
  'Math', 'max', 'min', 'floor', 'ceil', 'round', 'random',
  
  // 기본 키워드
  'return', 'break', 'continue', 'true', 'false', 'null', 'undefined'
];

// 레벨 4-5: 함께 사용될 때 의미를 갖는 핵심 키워드 (2-3개)
const LEVEL345_CANDIDATES = [
  ...LEVEL3_BASE_CANDIDATES,
  
  // DOM 조작
  'document', 'getElementById', 'getElementsByClassName', 'getElementsByTagName',
  'querySelector', 'querySelectorAll', 'createElement', 'appendChild',
  'removeChild', 'insertBefore', 'replaceChild',
  
  // 이벤트 처리
  'addEventListener', 'removeEventListener', 'preventDefault', 'stopPropagation',
  'click', 'change', 'submit', 'load', 'DOMContentLoaded',
  
  // 비동기 처리
  'async', 'await', 'Promise', 'resolve', 'reject', 'then', 'catch',
  'fetch', 'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval',
  
  // 객체/클래스
  'constructor', 'prototype', 'this', 'super', 'extends', 'static',
  'get', 'set', 'hasOwnProperty', 'keys', 'values', 'entries',
  
  // 조건/반복
  'if', 'else', 'switch', 'case', 'default', 'for', 'while', 'do',
  
  // 함수 관련
  'function', 'arrow', 'bind', 'call', 'apply', 'arguments',
  
  // ES6+ 특징
  'const', 'let', 'var', 'class', 'import', 'export', 'default',
  'destructuring', 'spread', 'rest', 'template', 'literals',
  
  // API/AJAX
  'XMLHttpRequest', 'FormData', 'URLSearchParams', 'Headers',
  'Request', 'Response', 'blob', 'arrayBuffer', 'text',
  
  // 스토리지
  'localStorage', 'sessionStorage', 'getItem', 'setItem', 'removeItem',
  
  // 정규식
  'RegExp', 'test', 'exec', 'match', 'search', 'replace',
  
  // JSON 처리
  'JSON', 'parse', 'stringify',
  
  // 에러 처리
  'try', 'catch', 'finally', 'throw', 'Error', 'TypeError',
  
  // 프로젝트별 주요 키워드 (알고리즘 학습 플랫폼)
  'algorithm', 'problem', 'solution', 'test', 'case', 'input', 'output',
  'complexity', 'time', 'space', 'recursion', 'iteration', 'graph',
  'tree', 'array', 'string', 'number', 'boolean', 'object'
];

// 레벨별 후보 목록 반환 함수
function getBlankCandidates(level) {
  // 레벨 3은 기본 후보만, 레벨 4-5는 확장된 후보 목록 사용
  if (level === 3) return LEVEL3_BASE_CANDIDATES;
  if (level >= 4 && level <= 5) return LEVEL345_CANDIDATES;
  return LEVEL3_BASE_CANDIDATES; // 다른 레벨은 기본값
}

// === 유틸: 강건 JSON 파서 + JS용 정리 ===
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
function sanitizeWord(s) {
  if (!s) return 'x';
  const first = String(s).trim().split(/\s+/)[0];
  return first.replace(/[^A-Za-z0-9_]/g, '').toLowerCase() || 'x';
}

// 코드에서 후보 목록에 포함된 키워드 찾기 (메소드 체이닝 지원)
function findCandidatesInCode(code, candidates) {
  if (!code || !candidates) return [];
  
  const foundWords = [];
  const codeStr = String(code);
  
  for (const candidate of candidates) {
    // 다양한 패턴으로 매칭
    const patterns = [
      new RegExp(`\\b${escapeRegex(candidate)}\\b`, 'g'),     // 일반 단어: sum, result
      new RegExp(`\\.${escapeRegex(candidate)}\\b`, 'g'),     // 메소드/속성: .length, .map
      new RegExp(`\\.${escapeRegex(candidate)}\\(`, 'g'),     // 메소드 호출: .json(), .push()
      new RegExp(`\\b${escapeRegex(candidate)}\\(`, 'g'),     // 함수 호출: getElementById()
      new RegExp(`\\b${escapeRegex(candidate)}\\.`, 'g'),     // 객체 접근: response.json, arr.length
    ];
    
    let found = false;
    for (const pattern of patterns) {
      if (pattern.test(codeStr)) {
        found = true;
        break;
      }
    }
    
    if (found) {
      foundWords.push(candidate);
    }
  }
  
  return foundWords;
}

// 메소드 체이닝 패턴 분석 (연속된 키워드 쌍 찾기)
function findMethodChains(code, candidates) {
  if (!code || !candidates) return [];
  
  const chains = [];
  const codeStr = String(code);
  
  // 객체.메소드() 패턴 찾기: object.method()
  const chainPattern = /(\w+)\.(\w+)(\(.*?\))?/g;
  let match;
  
  while ((match = chainPattern.exec(codeStr)) !== null) {
    const [fullMatch, objectName, methodName] = match;
    
    // 둘 다 후보 목록에 있는지 확인
    if (candidates.includes(objectName) && candidates.includes(methodName)) {
      chains.push({
        object: objectName,
        method: methodName,
        fullMatch: fullMatch,
        position: match.index
      });
    }
  }
  
  return chains;
}

// 정규식 특수문자 이스케이프
function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// 레벨별 N개 랜덤 선택 (메소드 체이닝 우선 고려)
function selectRandomBlanks(foundWords, level, code = '') {
  if (!foundWords || foundWords.length === 0) return [];
  
  // 레벨별 블랭크 개수
  let blankCount = 1;
  if (level === 3) blankCount = 1;
  else if (level === 4) blankCount = 2;
  else if (level === 5) blankCount = 3;
  
  // 레벨 4-5일 때 메소드 체이닝 패턴 우선 검토
  if ((level === 4 || level === 5) && blankCount >= 2 && code) {
    const candidates = getBlankCandidates(level);
    const chains = findMethodChains(code, candidates);
    
    // 메소드 체이닝이 있으면 우선 선택
    if (chains.length > 0) {
      const randomChain = chains[Math.floor(Math.random() * chains.length)];
      const selectedPairs = [randomChain.object, randomChain.method];
      
      // 레벨 5는 3개이므로 하나 더 추가
      if (level === 5 && foundWords.length > 2) {
        const remaining = foundWords.filter(w => !selectedPairs.includes(w));
        if (remaining.length > 0) {
          selectedPairs.push(remaining[Math.floor(Math.random() * remaining.length)]);
        }
      }
      
      return selectedPairs.slice(0, blankCount);
    }
  }
  
  // 일반적인 랜덤 선택
  const shuffled = [...foundWords].sort(() => Math.random() - 0.5);
  
  // 중복 제거 후 필요한 개수만큼 선택
  const uniqueWords = [...new Set(shuffled)];
  return uniqueWords.slice(0, blankCount);
}

// 선택된 키워드로 코드에 블랭크 적용 (새로운 데이터 구조)
function applyBlanksToCode(code, selectedWords) {
  if (!code || !selectedWords || selectedWords.length === 0) return { templateCode: code, solutions: [] };
  
  let modifiedCode = String(code);
  const solutions = [];
  
  selectedWords.forEach((word, index) => {
    const blankId = index + 1;
    const placeholder = `__${blankId}__`; // 표준 플레이스홀더 형식 사용
    
    // 여러 패턴으로 단어 찾기 및 교체 (첫 번째 매칭만)
    const patterns = [
      { 
        regex: new RegExp(`\\b${escapeRegex(word)}\\b`),  // 'g' 플래그 제거
        replacement: placeholder
      },
      { 
        regex: new RegExp(`\\.${escapeRegex(word)}\\b`),  // 'g' 플래그 제거
        replacement: `.${placeholder}`
      },
      { 
        regex: new RegExp(`\\b${escapeRegex(word)}\\(`),  // 'g' 플래그 제거
        replacement: `${placeholder}(`
      }
    ];
    
    // 첫 번째 매칭만 교체 (패턴 우선순위대로 시도)
    for (const pattern of patterns) {
      if (pattern.regex.test(modifiedCode)) {
        modifiedCode = modifiedCode.replace(pattern.regex, pattern.replacement);
        break;
      }
    }
    
    solutions.push({
      placeholder: placeholder,
      answer: word,
      hint: getHintForKeyword(word)
    });
  });
  
  return { templateCode: modifiedCode, solutions };
}

// 키워드별 힌트 생성
function getHintForKeyword(word) {
  const hintMap = {
    // 배열 메소드
    'length': '배열의 길이',
    'map': '배열 변환 메소드',
    'filter': '배열 필터링 메소드',
    'push': '배열 끝에 추가',
    'pop': '배열 끝에서 제거',
    'sort': '배열 정렬',
    'find': '조건에 맞는 첫 요소 찾기',
    'slice': '배열 일부 추출',
    'includes': '요소 포함 여부 확인',
    
    // DOM 관련
    'document': '문서 객체',
    'getElementById': 'ID로 요소 찾기',
    'querySelector': 'CSS 선택자로 요소 찾기',
    'addEventListener': '이벤트 리스너 추가',
    
    // 비동기
    'async': '비동기 함수',
    'await': '비동기 대기',
    'Promise': '프로미스 객체',
    'fetch': 'HTTP 요청',
    
    // 기본 키워드
    'function': '함수 선언',
    'return': '값 반환',
    'const': '상수 선언',
    'let': '변수 선언',
    'if': '조건문',
    'for': '반복문',
    'while': '반복문',
    
    // 변수명
    'sum': '합계 변수',
    'result': '결과 변수',
    'count': '개수 변수',
    'index': '인덱스 변수',
    'data': '데이터 변수',
  };
  
  return hintMap[word] || `${word} 키워드`;
}

function enforceClozeShape(result, level) {
  if (!result || typeof result !== 'object') return result;
  let code = String(result.code || '');
  
  // 🔧 중복 플레이스홀더 제거 로직 (OpenAI가 중복 생성할 경우 대비)
  const blankCount = level === 3 ? 1 : level === 4 ? 2 : level === 5 ? 3 : 1;
  
  // 코드에서 사용된 모든 플레이스홀더 ID 찾기 및 중복 재할당
  const usedIds = new Set(); // 이미 할당된 ID 추적
  let nextAvailableId = 1;
  
  // 각 플레이스홀더를 순서대로 처리
  for (let targetId = 1; targetId <= blankCount; targetId++) {
    const placeholder = `__${targetId}__`;
    const regex = new RegExp(escapeRegex(placeholder), 'g');
    const matches = code.match(regex);
    
    if (!matches || matches.length === 0) continue;
    
    if (matches.length === 1) {
      // 중복 없음
      usedIds.add(targetId);
    } else {
      // 중복 발견!
      console.log(`[enforceClozeShape] 중복 발견: ${placeholder} (${matches.length}번 나타남)`);
      let replacementCount = 0;
      
      code = code.replace(regex, (match) => {
        replacementCount++;
        
        if (replacementCount === 1) {
          // 첫 번째는 유지
          usedIds.add(targetId);
          return match;
        } else {
          // 두 번째 이후는 사용 가능한 다음 ID로 재할당
          while (usedIds.has(nextAvailableId) && nextAvailableId <= blankCount) {
            nextAvailableId++;
          }
          
          if (nextAvailableId <= blankCount) {
            usedIds.add(nextAvailableId);
            const newPlaceholder = `__${nextAvailableId}__`;
            console.log(`[enforceClozeShape] 재할당: ${placeholder} → ${newPlaceholder} (${replacementCount}번째)`);
            return newPlaceholder;
          } else {
            // 블랭크 개수 초과 시 임시 식별자로 변경
            console.log(`[enforceClozeShape] 경고: 블랭크 개수 초과, 임시 식별자 생성`);
            return `tempId${targetId}_${replacementCount}`;
          }
        }
      });
    }
  }
  
  // 코드 분석 기반 블랭크 생성 (새로운 데이터 구조)
  const candidates = getBlankCandidates(level);
  const foundWords = findCandidatesInCode(code, candidates);
  const selectedWords = selectRandomBlanks(foundWords, level, code);
  
  if (selectedWords.length > 0) {
    const { templateCode, solutions } = applyBlanksToCode(code, selectedWords);
    return { 
      ...result, 
      code: templateCode,           // 템플릿 코드 (__1__, __2__ 포함)
      templateCode: templateCode,   // 명시적 필드명
      solutions: solutions,         // 새로운 solutions 배열 구조
      blanks: solutions.map((s, i) => ({  // 기존 호환성을 위한 변환
        id: i + 1,
        answer: s.answer,
        hint: s.hint
      }))
    };
  }
  
  // 후보가 없을 경우 기존 로직 사용 (표준 플레이스홀더 형식)
  const blanks = [];

  // 동적으로 블랭크 생성
  for (let i = 1; i <= blankCount; i++) {
    const placeholder = `__${i}__`;  // 표준 플레이스홀더 형식
    if (!new RegExp(escapeRegex(placeholder)).test(code)) {
      code = code.replace(/\b([A-Za-z_][A-Za-z0-9_]*)\b/, placeholder);
    }
    blanks.push({ 
      id: i,
      answer: sanitizeWord(result.blanks?.[i-1]?.answer) || `identifier${i}`,
      hint: '식별자(한 단어)' 
    });
  }

  return { 
    ...result, 
    code,
    templateCode: code,
    blanks 
  };
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

module.exports = {
  // 강건 JSON 파서
  extractFirstJsonLike,
  safeParse,
  normalizeJsPlaceholders,
  
  // 레벨0 전용 유틸
  sanitizeSingleWordToken,
  extractPlaceholderIds,
  replacePlaceholder,
  enforceLevel0Shape,
  
  // 레벨 3-5 전용 유틸
  sanitizeWord,
  enforceClozeShape,
  
  // 레벨별 블랭크 후보 목록
  getBlankCandidates,
  LEVEL3_BASE_CANDIDATES,
  LEVEL345_CANDIDATES,
  
  // 코드 분석 기반 블랭크 생성
  findCandidatesInCode,
  findMethodChains,
  selectRandomBlanks,
  applyBlanksToCode,
  getHintForKeyword
};
