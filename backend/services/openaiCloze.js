'use strict';

if (!global.fetch) {
  global.fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));
}

// === 레벨별 블랭크 후보 목록 정의 ===

// 레벨 2: 핵심 기능을 담당하는 메소드, 속성, 주요 변수명 (1개)
const LEVEL2_CANDIDATES = [
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

// 레벨 3: 함께 사용될 때 의미를 갖는 핵심 키워드 (2개)
const LEVEL3_CANDIDATES = [
  ...LEVEL2_CANDIDATES,
  
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
  // 레벨 2~3은 모두 동일한 확장된 후보 목록 사용
  if (level === 2 || level === 3) return LEVEL3_CANDIDATES;
  return LEVEL2_CANDIDATES; // 다른 레벨은 기본값
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
  
  const blankCount = level === 2 ? 1 : level === 3 ? 2 : 1;
  
  // 레벨 3일 때 메소드 체이닝 패턴 우선 검토
  if (level === 3 && blankCount === 2 && code) {
    const candidates = getBlankCandidates(level);
    const chains = findMethodChains(code, candidates);
    
    // 메소드 체이닝이 있으면 우선 선택
    if (chains.length > 0) {
      const randomChain = chains[Math.floor(Math.random() * chains.length)];
      return [randomChain.object, randomChain.method];
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
    const placeholder = `BLANK_${blankId}`;
    
    // 여러 패턴으로 단어 찾기 및 교체
    const patterns = [
      { 
        regex: new RegExp(`\\b${escapeRegex(word)}\\b`, 'g'),
        replacement: placeholder
      },
      { 
        regex: new RegExp(`\\.${escapeRegex(word)}\\b`, 'g'),
        replacement: `.${placeholder}`
      },
      { 
        regex: new RegExp(`\\b${escapeRegex(word)}\\(`, 'g'),
        replacement: `${placeholder}(`
      }
    ];
    
    let replaced = false;
    for (const pattern of patterns) {
      if (pattern.regex.test(modifiedCode)) {
        // 첫 번째 매칭만 교체
        modifiedCode = modifiedCode.replace(pattern.regex, (match) => {
          if (!replaced) {
            replaced = true;
            return pattern.replacement;
          }
          return match;
        });
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
  
  // 코드 분석 기반 블랭크 생성 (새로운 데이터 구조)
  const candidates = getBlankCandidates(level);
  const foundWords = findCandidatesInCode(code, candidates);
  const selectedWords = selectRandomBlanks(foundWords, level, code);
  
  if (selectedWords.length > 0) {
    const { templateCode, solutions } = applyBlanksToCode(code, selectedWords);
    return { 
      ...result, 
      code: templateCode,           // 템플릿 코드 (BLANK_1, BLANK_2 포함)
      templateCode: templateCode,   // 명시적 필드명
      solutions: solutions,         // 새로운 solutions 배열 구조
      blanks: solutions            // 기존 호환성을 위한 필드
    };
  }
  
  // 후보가 없을 경우 기존 로직 사용 (새로운 구조로 변환)
  const solutions = [];

  if (level === 2) {
    // BLANK_1 하나만
    if (!/BLANK_1/.test(code)) {
      code = code.replace(/\b([A-Za-z_][A-Za-z0-9_]*)\b/, 'BLANK_1');
    }
    solutions.push({ 
      placeholder: 'BLANK_1', 
      answer: sanitizeWord(result.blanks?.[0]?.answer) || 'identifier',
      hint: '식별자(한 단어)' 
    });
    return { 
      ...result, 
      code,
      templateCode: code,
      solutions,
      blanks: solutions 
    };
  }

  if (level === 3) {
    // BLANK_1, BLANK_2 두 개
    if (!/BLANK_1/.test(code)) {
      code = code.replace(/\b([A-Za-z_][A-Za-z0-9_]*)\b/, 'BLANK_1');
    }
    if (!/BLANK_2/.test(code)) {
      code = code.replace(/\b([A-Za-z_][A-Za-z0-9_]*)\b/, 'BLANK_2');
    }
    solutions.push(
      { 
        placeholder: 'BLANK_1', 
        answer: sanitizeWord(result.blanks?.[0]?.answer) || 'identifier1',
        hint: '식별자(한 단어)' 
      },
      { 
        placeholder: 'BLANK_2', 
        answer: sanitizeWord(result.blanks?.[1]?.answer) || 'identifier2',
        hint: '식별자(한 단어)' 
      }
    );
    return { 
      ...result, 
      code,
      templateCode: code,
      solutions,
      blanks: solutions 
    };
  }

  return result;
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
  
  // 레벨 2~3 전용 유틸
  sanitizeWord,
  enforceClozeShape,
  
  // 레벨별 블랭크 후보 목록
  getBlankCandidates,
  LEVEL2_CANDIDATES,
  LEVEL3_CANDIDATES,
  
  // 코드 분석 기반 블랭크 생성
  findCandidatesInCode,
  findMethodChains,
  selectRandomBlanks,
  applyBlanksToCode,
  getHintForKeyword
};
