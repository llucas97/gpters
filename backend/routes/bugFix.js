const express = require('express');
const router = express.Router();
const { generateBugFixProblem, validateBugFix } = require('../services/openaiDebugFix');

/**
 * 버그 수정하기 문제 생성 API
 * POST /api/bug-fix/generate
 */
router.post('/generate', async (req, res) => {
  try {
    const { level = 5, topic = 'algorithm', language = 'javascript' } = req.body;
    
    // 입력 검증
    if (typeof level !== 'number' || level < 0 || level > 30) {
      return res.status(400).json({ 
        error: 'Invalid level. Level must be a number between 0 and 30.' 
      });
    }
    
    if (typeof topic !== 'string' || topic.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Invalid topic. Topic must be a non-empty string.' 
      });
    }
    
    const supportedLanguages = ['javascript', 'python', 'java', 'cpp', 'c'];
    if (!supportedLanguages.includes(language.toLowerCase())) {
      return res.status(400).json({ 
        error: `Unsupported language. Supported languages: ${supportedLanguages.join(', ')}` 
      });
    }

    console.log(`Generating bug fix problem: Level ${level}, Topic: ${topic}, Language: ${language}`);
    
    // 버그 수정하기 문제 생성
    const problem = await generateBugFixProblem({ 
      level, 
      topic: topic.trim(), 
      language: language.toLowerCase() 
    });
    
    res.json({
      success: true,
      data: problem,
      message: 'Bug fix problem generated successfully'
    });
    
  } catch (error) {
    console.error('Error generating bug fix problem:', error);
    res.status(500).json({ 
      error: 'Failed to generate bug fix problem',
      details: error.message 
    });
  }
});

/**
 * 버그 수정하기 문제 검증 API
 * POST /api/bug-fix/validate
 */
router.post('/validate', async (req, res) => {
  try {
    const { problem, userCode } = req.body;
    
    if (!problem || typeof userCode !== 'string') {
      return res.status(400).json({ 
        error: 'Missing required fields: problem and userCode (string)' 
      });
    }
    
    if (userCode.trim().length === 0) {
      return res.status(400).json({ 
        error: 'userCode cannot be empty' 
      });
    }
    
    // 답안 검증
    const validation = validateBugFix(problem, userCode);
    
    res.json({
      success: true,
      data: validation,
      message: validation.isCorrect ? 
        'Bug fixed successfully!' : 
        'Bug not fixed yet or new issues introduced.'
    });
    
  } catch (error) {
    console.error('Error validating bug fix:', error);
    res.status(500).json({ 
      error: 'Failed to validate bug fix',
      details: error.message 
    });
  }
});

/**
 * 버그 수정하기 문제 힌트 API
 * POST /api/bug-fix/hint
 */
router.post('/hint', async (req, res) => {
  try {
    const { problem, hintLevel = 1 } = req.body;
    
    if (!problem) {
      return res.status(400).json({ 
        error: 'Missing required field: problem' 
      });
    }
    
    const { buggyLineNumber, bugDescription, language } = problem;
    
    if (typeof hintLevel !== 'number' || hintLevel < 1 || hintLevel > 3) {
      return res.status(400).json({ 
        error: 'hintLevel must be a number between 1 and 3' 
      });
    }
    
    let hint = '';
    
    // 힌트 레벨에 따라 다른 정보 제공
    switch (hintLevel) {
      case 1:
        hint = `코드에 버그가 있습니다. 코드를 자세히 살펴보고 논리적 오류를 찾아보세요.`;
        break;
      case 2:
        hint = `${buggyLineNumber}번째 라인 근처를 주의깊게 확인해보세요. 이 부분에 문제가 있을 수 있습니다.`;
        break;
      case 3:
        hint = `${buggyLineNumber}번째 라인에 ${language} 관련 문제가 있습니다. 연산자나 메소드 호출을 다시 확인해보세요.`;
        break;
      default:
        hint = '코드를 다시 한번 검토해보세요.';
    }
    
    res.json({
      success: true,
      data: {
        hint,
        hintLevel,
        buggyLineNumber: hintLevel >= 2 ? buggyLineNumber : null,
        language
      },
      message: 'Hint provided successfully'
    });
    
  } catch (error) {
    console.error('Error providing hint:', error);
    res.status(500).json({ 
      error: 'Failed to provide hint',
      details: error.message 
    });
  }
});

/**
 * 버그 수정하기 문제 해답 API (관리자용)
 * POST /api/bug-fix/solution
 */
router.post('/solution', async (req, res) => {
  try {
    const { problem, adminKey } = req.body;
    
    // 간단한 관리자 키 검증 (실제 운영에서는 더 강력한 인증 필요)
    if (adminKey !== process.env.ADMIN_KEY && adminKey !== 'debug_solution') {
      return res.status(403).json({ 
        error: 'Access denied. Admin key required.' 
      });
    }
    
    if (!problem) {
      return res.status(400).json({ 
        error: 'Missing required field: problem' 
      });
    }
    
    const { correctCode, bugDescription, buggyLineNumber } = problem;
    
    res.json({
      success: true,
      data: {
        correctCode,
        bugDescription,
        buggyLineNumber,
        explanation: '관리자용 정답 코드입니다. 이 정보는 디버깅 목적으로만 사용되어야 합니다.'
      },
      message: 'Solution provided for admin'
    });
    
  } catch (error) {
    console.error('Error providing solution:', error);
    res.status(500).json({ 
      error: 'Failed to provide solution',
      details: error.message 
    });
  }
});

module.exports = router;
