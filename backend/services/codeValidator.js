// backend/services/codeValidator.js
'use strict';

const { VM } = require('vm2');

/**
 * 코드 검증 서비스
 * 사용자가 제출한 코드를 테스트 케이스로 검증
 */
class CodeValidator {
  
  /**
   * JavaScript 코드 검증
   * @param {string} userCode - 사용자가 제출한 전체 코드
   * @param {Array} testCases - 테스트 케이스 배열 [{input, expected_output}]
   * @param {number} timeoutMs - 실행 시간 제한 (기본 5초)
   * @returns {Object} 검증 결과
   */
  static validateJavaScript(userCode, testCases, timeoutMs = 5000) {
    try {
      console.log('[CodeValidator] JavaScript 코드 검증 시작');
      console.log('[CodeValidator] 사용자 코드:', userCode.substring(0, 200) + '...');
      
      const results = [];
      
      for (let i = 0; i < testCases.length; i++) {
        const testCase = testCases[i];
        console.log(`[CodeValidator] 테스트 케이스 ${i + 1} 실행 중...`);
        
        try {
          // VM2를 사용한 안전한 코드 실행 환경
          const vm = new VM({
            timeout: timeoutMs,
            sandbox: {
              console: {
                log: () => {}, // console.log 비활성화
                error: () => {},
                warn: () => {}
              }
            }
          });
          
          // 테스트 케이스 입력을 파싱하여 변수로 설정
          let testSetupCode = '';
          if (testCase.input && typeof testCase.input === 'object') {
            // 객체 형태의 입력 (예: {arr: [1,2,3], target: 2})
            Object.keys(testCase.input).forEach(key => {
              testSetupCode += `const ${key} = ${JSON.stringify(testCase.input[key])};\n`;
            });
          }
          
          // 사용자 코드 + 테스트 셋업 + 함수 호출
          const fullCode = `
            ${userCode}
            ${testSetupCode}
            ${testCase.functionCall || 'result'} // 함수 호출 또는 결과 계산
          `;
          
          console.log(`[CodeValidator] 실행할 전체 코드:`, fullCode);
          
          const result = vm.run(fullCode);
          
          // 결과 비교
          const passed = this.compareResults(result, testCase.expected_output);
          
          results.push({
            testCase: i + 1,
            input: testCase.input,
            expected: testCase.expected_output,
            actual: result,
            passed,
            error: null
          });
          
          console.log(`[CodeValidator] 테스트 케이스 ${i + 1} 결과:`, { expected: testCase.expected_output, actual: result, passed });
          
        } catch (error) {
          console.error(`[CodeValidator] 테스트 케이스 ${i + 1} 실행 오류:`, error.message);
          
          results.push({
            testCase: i + 1,
            input: testCase.input,
            expected: testCase.expected_output,
            actual: null,
            passed: false,
            error: error.message
          });
        }
      }
      
      const passedCount = results.filter(r => r.passed).length;
      const allPassed = passedCount === testCases.length;
      
      console.log(`[CodeValidator] 검증 완료: ${passedCount}/${testCases.length} 테스트 통과`);
      
      return {
        success: true,
        allPassed,
        passedCount,
        totalCount: testCases.length,
        results,
        score: Math.round((passedCount / testCases.length) * 100)
      };
      
    } catch (error) {
      console.error('[CodeValidator] JavaScript 검증 오류:', error);
      return {
        success: false,
        error: error.message,
        allPassed: false,
        passedCount: 0,
        totalCount: testCases.length,
        results: []
      };
    }
  }
  
  /**
   * Python 코드 검증 (향후 확장용)
   * @param {string} userCode - 사용자가 제출한 전체 코드
   * @param {Array} testCases - 테스트 케이스 배열
   * @returns {Object} 검증 결과
   */
  static validatePython(userCode, testCases) {
    // 향후 Python 코드 검증을 위한 플레이스홀더
    console.log('[CodeValidator] Python 검증은 아직 지원되지 않습니다.');
    return {
      success: false,
      error: 'Python validation not implemented yet',
      allPassed: false,
      passedCount: 0,
      totalCount: testCases.length,
      results: []
    };
  }
  
  /**
   * 결과 비교 (깊은 비교)
   * @param {any} actual - 실제 결과
   * @param {any} expected - 예상 결과
   * @returns {boolean} 일치 여부
   */
  static compareResults(actual, expected) {
    try {
      // JSON stringify를 사용한 깊은 비교
      return JSON.stringify(actual) === JSON.stringify(expected);
    } catch (error) {
      // 순환 참조 등으로 JSON.stringify 실패 시 직접 비교
      return actual === expected;
    }
  }
  
  /**
   * 언어별 코드 검증 메인 함수
   * @param {string} language - 프로그래밍 언어 ('javascript', 'python' 등)
   * @param {string} userCode - 사용자 코드
   * @param {Array} testCases - 테스트 케이스
   * @returns {Object} 검증 결과
   */
  static validate(language, userCode, testCases) {
    console.log(`[CodeValidator] 코드 검증 시작 - 언어: ${language}`);
    
    if (!userCode || !testCases || testCases.length === 0) {
      return {
        success: false,
        error: 'Invalid input: userCode and testCases are required',
        allPassed: false,
        passedCount: 0,
        totalCount: 0,
        results: []
      };
    }
    
    switch (language.toLowerCase()) {
      case 'javascript':
      case 'js':
        return this.validateJavaScript(userCode, testCases);
      
      case 'python':
      case 'py':
        return this.validatePython(userCode, testCases);
      
      default:
        return {
          success: false,
          error: `Unsupported language: ${language}`,
          allPassed: false,
          passedCount: 0,
          totalCount: testCases.length,
          results: []
        };
    }
  }
}

module.exports = CodeValidator;
