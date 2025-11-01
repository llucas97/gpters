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
// 각 키워드가 여러 번 나타나면 랜덤하게 하나만 블랭크로 처리
// 반환값: { templateCode, solutions, blankMappings } - 블랭크 코드와 매핑 정보
function applyBlanksToCode(code, selectedWords) {
  if (!code || !selectedWords || selectedWords.length === 0) {
    return { templateCode: code, solutions: [], blankMappings: [] };
  }
  
  // 원본 코드를 기반으로 모든 키워드의 위치를 먼저 찾기
  const originalCode = String(code);
  const allKeywordPositions = new Map(); // keyword -> [positions]
  
  selectedWords.forEach((word) => {
    if (!allKeywordPositions.has(word)) {
      const positions = [];
      
      // 여러 패턴으로 단어 찾기
      const patterns = [
        { 
          regex: new RegExp(`\\b${escapeRegex(word)}\\b`, 'g'),
          offset: 0
        },
        { 
          regex: new RegExp(`\\.${escapeRegex(word)}\\b`, 'g'),
          offset: 1  // '.' 문자 하나 offset
        },
        { 
          regex: new RegExp(`\\b${escapeRegex(word)}\\(`, 'g'),
          offset: 0
        }
      ];
      
      for (const pattern of patterns) {
        let match;
        const regexCopy = new RegExp(pattern.regex.source, pattern.regex.flags);
        while ((match = regexCopy.exec(originalCode)) !== null) {
          positions.push({
            index: match.index + pattern.offset,
            length: match[0].length - pattern.offset,
            keyword: word,
            offset: pattern.offset
          });
        }
      }
      
      allKeywordPositions.set(word, positions);
      console.log(`[applyBlanksToCode] 키워드 "${word}": ${positions.length}개 발견`, positions);
    }
  });
  
  // 각 키워드에 대해 랜덤으로 하나의 위치 선택
  const selectedPositions = [];
  selectedWords.forEach((word, index) => {
    const positions = allKeywordPositions.get(word) || [];
    
    if (positions.length === 0) {
      console.warn(`[applyBlanksToCode] 키워드 "${word}"가 코드에서 찾을 수 없습니다.`);
      return;
    }
    
    // 랜덤하게 하나 선택
    const randomIndex = Math.floor(Math.random() * positions.length);
    const selectedPosition = {
      ...positions[randomIndex],
      blankId: index + 1,
      keyword: word
    };
    
    console.log(`[applyBlanksToCode] BLANK_${index + 1} 선택: 키워드 "${word}" (${positions.length}개 중 ${randomIndex + 1}번째, 위치: ${selectedPosition.index})`);
    
    selectedPositions.push(selectedPosition);
  });
  
  // 위치 순서대로 정렬 (뒤에서부터 교체하여 인덱스 변경 방지)
  selectedPositions.sort((a, b) => b.index - a.index);
  
  // 뒤에서부터 교체하여 인덱스 변경 영향을 받지 않도록 처리
  let modifiedCode = originalCode;
  const solutions = [];
  const blankMappings = [];
  
  selectedPositions.forEach((position) => {
    const blankId = position.blankId;
    const placeholder = `__${blankId}__`;
    
    // 플레이스홀더 형식 결정 (패턴에 따라)
    let replacement = placeholder;
    if (position.offset === 1) {
      // .length, .map 같은 패턴
      replacement = `.${placeholder}`;
    } else if (originalCode[position.index + position.length] === '(') {
      // method() 같은 패턴
      replacement = `${placeholder}(`;
    }
    
    // 뒤에서부터 교체
    modifiedCode = 
      modifiedCode.slice(0, position.index) + 
      replacement + 
      modifiedCode.slice(position.index + position.length);
    
    // 매핑 정보 저장
    blankMappings.push({
      blankId: blankId,
      placeholder: `__${blankId}__`,
      keyword: position.keyword,
      originalIndex: position.index,
      originalLength: position.length
    });
    
    solutions.push({
      placeholder: placeholder,
      answer: position.keyword,
      hint: getHintForKeyword(position.keyword)
    });
  });
  
  // blankMappings를 blankId 순서대로 정렬
  blankMappings.sort((a, b) => a.blankId - b.blankId);
  
  // 최종 매핑 검증 로그
  console.log('[applyBlanksToCode] 최종 blankMappings:', blankMappings.map(m => ({
    blankId: m.blankId,
    placeholder: m.placeholder,
    keyword: m.keyword,
    originalIndex: m.originalIndex
  })));
  console.log('[applyBlanksToCode] solutions 배열:', solutions.map(s => ({
    placeholder: s.placeholder,
    answer: s.answer
  })));
  
  // 검증: blankMappings와 solutions가 일치하는지 확인
  const mappingMatch = blankMappings.every((mapping, idx) => {
    const expectedKeyword = selectedWords[idx];
    const actualKeyword = mapping.keyword;
    const match = expectedKeyword === actualKeyword;
    if (!match) {
      console.error(`[applyBlanksToCode] 매핑 불일치! BLANK_${mapping.blankId}: selectedWords[${idx}]="${expectedKeyword}" != blankMappings.keyword="${actualKeyword}"`);
    }
    return match;
  });
  
  if (!mappingMatch) {
    console.error('[applyBlanksToCode] ⚠️ 경고: blankMappings와 selectedWords가 일치하지 않습니다!');
  }
  
  return { 
    templateCode: modifiedCode, 
    solutions,
    blankMappings // BLANK_ID -> keyword 매핑 정보 (채점 시 사용)
  };
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
    const { templateCode, solutions, blankMappings } = applyBlanksToCode(code, selectedWords);
    return { 
      ...result, 
      code: templateCode,           // 템플릿 코드 (__1__, __2__ 포함)
      templateCode: templateCode,   // 명시적 필드명
      solutions: solutions,         // 새로운 solutions 배열 구조
      blankMappings: blankMappings, // BLANK_ID -> keyword 매핑 정보 (채점 시 사용)
      blanks: solutions.map((s, i) => ({  // 기존 호환성을 위한 변환
        id: i + 1,
        answer: s.answer,
        hint: s.hint
      }))
    };
  }
  
  // 후보가 없을 경우 기존 로직 사용 (표준 플레이스홀더 형식)
  // 하지만 blankMappings도 생성하여 채점 시 사용할 수 있도록 함
  const blanks = [];
  const blankMappings = [];
  const solutions = [];
  
  // 원본 코드 백업 (정답 키워드 위치 찾기용)
  const originalCode = String(code);
  
  // 먼저 모든 키워드의 위치를 찾기
  // 같은 키워드가 여러 빈칸에 사용되는 경우를 대비해 키워드별로 위치를 저장
  const keywordPositionsMap = new Map(); // keyword -> [positions]
  const blankKeywords = []; // 빈칸별 키워드 저장
  
  for (let i = 1; i <= blankCount; i++) {
    const placeholder = `__${i}__`;
    let answer = sanitizeWord(result.blanks?.[i-1]?.answer) || `identifier${i}`;
    blankKeywords.push({ blankId: i, placeholder, keyword: answer });
    
    // 같은 키워드가 이미 처리되었으면 건너뛰기
    if (keywordPositionsMap.has(answer)) continue;
    
    // 원본 코드에서 키워드 위치 찾기
    const patterns = [
      { 
        regex: new RegExp(`\\b${escapeRegex(answer)}\\b`, 'g'),
        offset: 0
      },
      { 
        regex: new RegExp(`\\.${escapeRegex(answer)}\\b`, 'g'),
        offset: 1  // '.' 문자 하나 offset
      },
      { 
        regex: new RegExp(`\\b${escapeRegex(answer)}\\(`, 'g'),
        offset: 0
      }
    ];
    
    const positions = [];
    for (const pattern of patterns) {
      let match;
      const regexCopy = new RegExp(pattern.regex.source, pattern.regex.flags);
      while ((match = regexCopy.exec(originalCode)) !== null) {
        positions.push({
          index: match.index + pattern.offset,
          length: match[0].length - pattern.offset,
          keyword: answer,
          offset: pattern.offset
        });
      }
    }
    
    keywordPositionsMap.set(answer, positions);
    console.log(`[enforceClozeShape] 키워드 "${answer}": ${positions.length}개 발견`);
  }
  
  // 각 키워드에 대해 랜덤으로 하나의 위치만 선택 (같은 키워드는 같은 위치 사용)
  const keywordSelectedPositions = new Map(); // keyword -> selectedPosition
  keywordPositionsMap.forEach((positions, keyword) => {
    if (positions.length === 0) {
      console.warn(`[enforceClozeShape] 키워드 "${keyword}"가 코드에서 찾을 수 없습니다.`);
      keywordSelectedPositions.set(keyword, null);
    } else {
      // 랜덤하게 하나 선택
      const randomIndex = Math.floor(Math.random() * positions.length);
      const selectedPosition = positions[randomIndex];
      keywordSelectedPositions.set(keyword, selectedPosition);
      console.log(`[enforceClozeShape] 키워드 "${keyword}": ${positions.length}개 중 ${randomIndex + 1}번째 위치 선택 (인덱스: ${selectedPosition.index})`);
    }
  });
  
  // 각 빈칸에 대해 선택된 위치 할당
  const selectedPositions = [];
  const missingKeywordBlanks = []; // 키워드를 찾지 못한 빈칸들
  
  blankKeywords.forEach(({ blankId, placeholder, keyword }) => {
    const selectedPosition = keywordSelectedPositions.get(keyword);
    
    if (!selectedPosition) {
      // 키워드를 찾지 못한 경우
      missingKeywordBlanks.push({
        blankId,
        placeholder,
        keyword
      });
    } else {
      // 선택된 위치 사용 (같은 키워드는 같은 위치 사용)
      selectedPositions.push({
        ...selectedPosition,
        blankId,
        keyword
      });
    }
    
    blanks.push({ 
      id: blankId,
      answer: keyword,
      hint: '식별자(한 단어)' 
    });
    
    solutions.push({
      placeholder: placeholder,
      answer: keyword,
      hint: '식별자(한 단어)'
    });
  })
  
  // 같은 위치(index)에 여러 빈칸이 할당된 경우 처리
  // 위치별로 그룹화하여 같은 위치는 한 번만 블랭크 처리
  const positionGroups = new Map(); // index -> [{blankId, keyword, ...}]
  selectedPositions.forEach((position) => {
    const key = `${position.index}_${position.length}`;
    if (!positionGroups.has(key)) {
      positionGroups.set(key, []);
    }
    positionGroups.get(key).push(position);
  });
  
  // 위치 순서대로 정렬 (뒤에서부터 교체하여 인덱스 변경 방지)
  const sortedPositions = Array.from(positionGroups.entries()).sort((a, b) => {
    const indexA = parseInt(a[0].split('_')[0]);
    const indexB = parseInt(b[0].split('_')[0]);
    return indexB - indexA;
  });
  
  // 뒤에서부터 교체
  let modifiedCode = originalCode;
  sortedPositions.forEach(([key, positions]) => {
    // 같은 위치에 여러 빈칸이 있으면 첫 번째 것만 사용 (같은 키워드는 이미 같은 위치로 그룹화됨)
    const position = positions[0];
    const placeholder = `__${position.blankId}__`;
    
    // 플레이스홀더 형식 결정
    let replacement = placeholder;
    if (position.offset === 1) {
      replacement = `.${placeholder}`;
    } else if (originalCode[position.index + position.length] === '(') {
      replacement = `${placeholder}(`;
    }
    
    modifiedCode = 
      modifiedCode.slice(0, position.index) + 
      replacement + 
      modifiedCode.slice(position.index + position.length);
    
    // 같은 위치의 모든 빈칸에 대해 매핑 정보 추가
    positions.forEach((pos) => {
      blankMappings.push({
        blankId: pos.blankId,
        placeholder: `__${pos.blankId}__`,
        keyword: pos.keyword,
        originalIndex: pos.index,
        originalLength: pos.length
      });
    });
  });
  
  // 키워드를 찾지 못한 빈칸 처리
  missingKeywordBlanks.forEach((blank) => {
    // 이미 플레이스홀더가 있으면 그대로 사용
    if (!new RegExp(escapeRegex(blank.placeholder)).test(modifiedCode)) {
      modifiedCode = modifiedCode.replace(/\b([A-Za-z_][A-Za-z0-9_]*)\b/, blank.placeholder);
    }
    // blankMappings에 추가 (정확한 위치는 모르지만 매핑은 유지)
    blankMappings.push({
      blankId: blank.blankId,
      placeholder: blank.placeholder,
      keyword: blank.keyword,
      originalIndex: -1, // 위치 없음 표시
      originalLength: blank.keyword.length
    });
  });
  
  // blankMappings를 blankId 순서대로 정렬
  blankMappings.sort((a, b) => a.blankId - b.blankId);
  
  // 최종 코드는 modifiedCode 사용
  code = modifiedCode;

  return { 
    ...result, 
    code,
    templateCode: code,
    blanks,
    solutions, // solutions 배열 추가
    blankMappings // blankMappings 추가 (채점 시 사용)
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
