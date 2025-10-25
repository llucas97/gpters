'use strict';

/**
 * 문제 품질 검증 서비스
 * 생성된 문제가 최소 품질 기준을 만족하는지 검증
 */

/**
 * 기본 문제 구조 검증
 */
function validateBasicStructure(problem) {
  const errors = [];
  
  // 필수 필드 검증
  if (!problem.title || problem.title.trim().length === 0) {
    errors.push('제목이 누락되었습니다');
  }
  
  if (!problem.statement && !problem.description) {
    errors.push('문제 설명이 누락되었습니다');
  }
  
  if (problem.level === undefined || problem.level < 0 || problem.level > 30) {
    errors.push('올바르지 않은 난이도입니다 (0-30 사이여야 함)');
  }
  
  if (!problem.language) {
    errors.push('프로그래밍 언어가 지정되지 않았습니다');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Cloze 문제 (빈칸 채우기) 검증
 */
function validateCloze(problem) {
  const errors = [];
  const { code, blanks, level } = problem;
  
  if (!code || code.trim().length === 0) {
    errors.push('코드가 누락되었습니다');
    return { isValid: false, errors };
  }
  
  if (!blanks || !Array.isArray(blanks) || blanks.length === 0) {
    errors.push('빈칸(blanks) 정보가 누락되었습니다');
    return { isValid: false, errors };
  }
  
  // 레벨별 블랭크 개수 검증
  const expectedBlankCount = {
    0: 2,
    1: 3,
    2: 1,
    3: 2
  };
  
  if (expectedBlankCount[level] !== undefined) {
    if (blanks.length !== expectedBlankCount[level]) {
      errors.push(`레벨 ${level}은 ${expectedBlankCount[level]}개의 블랭크가 필요하지만 ${blanks.length}개가 생성되었습니다`);
    }
  }
  
  // 각 블랭크 검증
  blanks.forEach((blank, index) => {
    if (!blank.answer || blank.answer.trim().length === 0) {
      errors.push(`블랭크 ${index + 1}의 정답이 누락되었습니다`);
    }
    
    // 레벨 0-1은 단일 단어만 허용
    if (level <= 1) {
      const hasSpaces = /\s/.test(blank.answer);
      const hasSpecialChars = /[\(\)\[\]\{\}\+\-\*\/\=\<\>\!\&\|\,\.]/.test(blank.answer);
      
      if (hasSpaces || hasSpecialChars) {
        errors.push(`레벨 ${level}의 블랭크 ${index + 1}은 단일 단어여야 하지만 "${blank.answer}"는 공백이나 특수문자를 포함합니다`);
      }
    }
  });
  
  // placeholder 검증
  const placeholderRegex = /__\s*\d+\s*__|BLANK_\d+/g;
  const placeholders = code.match(placeholderRegex) || [];
  
  if (placeholders.length !== blanks.length) {
    errors.push(`코드의 플레이스홀더 개수(${placeholders.length})와 블랭크 개수(${blanks.length})가 일치하지 않습니다`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings: []
  };
}

/**
 * 블록 코딩 문제 검증
 */
function validateBlockCoding(problem) {
  const errors = [];
  const { blankedCode, blocks, blankCount, keywordsToBlank } = problem;
  
  if (!blankedCode || blankedCode.trim().length === 0) {
    errors.push('블랭크 코드가 누락되었습니다');
  }
  
  if (!blocks || !Array.isArray(blocks) || blocks.length === 0) {
    errors.push('드래그 블록 정보가 누락되었습니다');
  }
  
  if (!keywordsToBlank || !Array.isArray(keywordsToBlank)) {
    errors.push('키워드 정보가 누락되었습니다');
  }
  
  // 블록 개수 검증
  const answerBlocks = blocks.filter(b => b.type === 'answer');
  const distractorBlocks = blocks.filter(b => b.type === 'distractor');
  
  if (answerBlocks.length !== blankCount) {
    errors.push(`정답 블록 개수(${answerBlocks.length})가 블랭크 개수(${blankCount})와 일치하지 않습니다`);
  }
  
  if (distractorBlocks.length === 0) {
    errors.push('오답 블록(distractor)이 없습니다. 최소 1개 이상 필요합니다');
  }
  
  // 블랭크 placeholder 검증
  const placeholderRegex = /BLANK_\d+/g;
  const placeholders = blankedCode.match(placeholderRegex) || [];
  
  if (placeholders.length !== blankCount) {
    errors.push(`코드의 BLANK placeholder 개수(${placeholders.length})가 블랭크 개수(${blankCount})와 일치하지 않습니다`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * 코드 순서 맞추기 문제 검증
 */
function validateCodeOrdering(problem) {
  const errors = [];
  const { correctCode, shuffledLines, correctOrder, totalLines } = problem;
  
  if (!correctCode || correctCode.trim().length === 0) {
    errors.push('정답 코드가 누락되었습니다');
  }
  
  if (!shuffledLines || !Array.isArray(shuffledLines) || shuffledLines.length === 0) {
    errors.push('섞인 코드 라인이 누락되었습니다');
  }
  
  if (!correctOrder || !Array.isArray(correctOrder) || correctOrder.length === 0) {
    errors.push('정답 순서 정보가 누락되었습니다');
  }
  
  // 라인 개수 검증
  if (shuffledLines && correctOrder && shuffledLines.length !== correctOrder.length) {
    errors.push(`섞인 라인 개수(${shuffledLines.length})와 정답 순서 개수(${correctOrder.length})가 일치하지 않습니다`);
  }
  
  // 최소 라인 개수 검증
  if (totalLines < 3) {
    errors.push(`순서 맞추기 문제는 최소 3줄 이상이어야 하지만 ${totalLines}줄만 생성되었습니다`);
  }
  
  // 섞인 상태 검증 (정답과 같으면 안됨)
  if (shuffledLines && correctOrder) {
    const isSame = shuffledLines.every((line, index) => 
      line.trim() === correctOrder[index]?.trim()
    );
    
    if (isSame) {
      errors.push('섞인 라인이 정답 순서와 동일합니다. 재생성이 필요합니다');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * 버그 수정 문제 검증
 */
function validateBugFix(problem) {
  const errors = [];
  const { correctCode, buggyCode, bugDescription, bugInserted } = problem;
  
  if (!correctCode || correctCode.trim().length === 0) {
    errors.push('정답 코드가 누락되었습니다');
  }
  
  if (!buggyCode || buggyCode.trim().length === 0) {
    errors.push('버그가 있는 코드가 누락되었습니다');
  }
  
  if (!bugDescription) {
    errors.push('버그 설명이 누락되었습니다');
  }
  
  // 버그 삽입 여부 검증
  if (bugInserted === false) {
    errors.push('버그 삽입에 실패했습니다');
  }
  
  // 정답 코드와 버그 코드가 다른지 검증
  if (correctCode && buggyCode) {
    const normalizeCode = (code) => code.replace(/\s+/g, ' ').trim();
    
    if (normalizeCode(correctCode) === normalizeCode(buggyCode)) {
      errors.push('정답 코드와 버그 코드가 동일합니다. 버그가 제대로 삽입되지 않았습니다');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * 템플릿 코드 문제 검증 (레벨 4-5)
 */
function validateTemplateCode(problem) {
  const errors = [];
  const { templateCode, testCases, level } = problem;
  
  if (!templateCode || templateCode.trim().length === 0) {
    errors.push('템플릿 코드가 누락되었습니다');
  }
  
  // 레벨별 블랭크 개수 검증
  const expectedBlankCount = level === 4 ? 1 : level === 5 ? 2 : 0;
  
  if (expectedBlankCount > 0 && templateCode) {
    const blankRegex = /\/\/\s*BLANK_\d+/g;
    const blanks = templateCode.match(blankRegex) || [];
    
    if (blanks.length !== expectedBlankCount) {
      errors.push(`레벨 ${level}은 ${expectedBlankCount}개의 BLANK 주석이 필요하지만 ${blanks.length}개가 발견되었습니다`);
    }
  }
  
  // 테스트 케이스 검증
  if (!testCases || !Array.isArray(testCases) || testCases.length === 0) {
    errors.push('테스트 케이스가 누락되었습니다');
  } else {
    testCases.forEach((testCase, index) => {
      if (testCase.input === undefined) {
        errors.push(`테스트 케이스 ${index + 1}의 input이 누락되었습니다`);
      }
      if (testCase.expected_output === undefined) {
        errors.push(`테스트 케이스 ${index + 1}의 expected_output이 누락되었습니다`);
      }
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * 메인 검증 함수
 */
function validateProblem(problem, problemType) {
  // 기본 구조 검증
  const basicValidation = validateBasicStructure(problem);
  if (!basicValidation.isValid) {
    return basicValidation;
  }
  
  // 문제 유형별 검증
  let typeValidation;
  
  switch (problemType) {
    case 'cloze':
      typeValidation = validateCloze(problem);
      break;
    case 'block_coding':
      typeValidation = validateBlockCoding(problem);
      break;
    case 'code_ordering':
      typeValidation = validateCodeOrdering(problem);
      break;
    case 'bug_fixing':
      typeValidation = validateBugFix(problem);
      break;
    case 'template_code':
      typeValidation = validateTemplateCode(problem);
      break;
    default:
      typeValidation = { isValid: true, errors: [], warnings: ['알 수 없는 문제 유형입니다'] };
  }
  
  return {
    isValid: typeValidation.isValid,
    errors: [...basicValidation.errors, ...typeValidation.errors],
    warnings: typeValidation.warnings || []
  };
}

/**
 * 문제 유형 자동 감지
 */
function detectProblemType(problem) {
  if (problem.blankedCode && problem.blocks) {
    return 'block_coding';
  }
  if (problem.shuffledLines && problem.correctOrder) {
    return 'code_ordering';
  }
  if (problem.buggyCode && problem.correctCode) {
    return 'bug_fixing';
  }
  if (problem.templateCode && problem.testCases) {
    return 'template_code';
  }
  if (problem.code && problem.blanks) {
    return 'cloze';
  }
  return 'unknown';
}

/**
 * 검증 결과 포맷팅
 */
function formatValidationResult(validation, problemType) {
  const result = {
    success: validation.isValid,
    problemType,
    errors: validation.errors,
    warnings: validation.warnings || []
  };
  
  if (!validation.isValid) {
    result.message = `문제 검증 실패: ${validation.errors.length}개의 오류 발견`;
  } else if (validation.warnings && validation.warnings.length > 0) {
    result.message = `문제 검증 성공 (${validation.warnings.length}개의 경고 포함)`;
  } else {
    result.message = '문제 검증 성공';
  }
  
  return result;
}

module.exports = {
  validateProblem,
  detectProblemType,
  formatValidationResult,
  // 개별 검증 함수들 export
  validateBasicStructure,
  validateCloze,
  validateBlockCoding,
  validateCodeOrdering,
  validateBugFix,
  validateTemplateCode
};

