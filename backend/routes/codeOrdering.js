const express = require('express');
const router = express.Router();
const { generateCodeOrderingProblem, validateOrderingAnswer } = require('../services/openaiCodeOrdering');

/**
 * 순서 맞추기 문제 생성 API
 * POST /api/code-ordering/generate
 */
router.post('/generate', async (req, res) => {
  try {
    const { level = 4, topic = 'algorithm', language = 'javascript' } = req.body;
    
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

    console.log(`Generating code ordering problem: Level ${level}, Topic: ${topic}, Language: ${language}`);
    
    // 순서 맞추기 문제 생성
    const problem = await generateCodeOrderingProblem({ 
      level, 
      topic: topic.trim(), 
      language: language.toLowerCase() 
    });
    
    res.json({
      success: true,
      data: problem,
      message: 'Code ordering problem generated successfully'
    });
    
  } catch (error) {
    console.error('Error generating code ordering problem:', error);
    res.status(500).json({ 
      error: 'Failed to generate code ordering problem',
      details: error.message 
    });
  }
});

/**
 * 순서 맞추기 문제 검증 API
 * POST /api/code-ordering/validate
 */
router.post('/validate', async (req, res) => {
  try {
    const { problem, userOrderedLines } = req.body;
    
    if (!problem || !userOrderedLines) {
      return res.status(400).json({ 
        error: 'Missing required fields: problem and userOrderedLines' 
      });
    }
    
    if (!Array.isArray(userOrderedLines)) {
      return res.status(400).json({ 
        error: 'userOrderedLines must be an array' 
      });
    }
    
    // 답안 검증
    const validation = validateOrderingAnswer(problem, userOrderedLines);
    
    res.json({
      success: true,
      data: validation,
      message: validation.isCorrect ? 
        'All lines are in correct order!' : 
        'Some lines are not in correct order.'
    });
    
  } catch (error) {
    console.error('Error validating code ordering answer:', error);
    res.status(500).json({ 
      error: 'Failed to validate code ordering answer',
      details: error.message 
    });
  }
});

/**
 * 순서 맞추기 문제 힌트 API
 * POST /api/code-ordering/hint
 */
router.post('/hint', async (req, res) => {
  try {
    const { problem, currentOrder } = req.body;
    
    if (!problem || !currentOrder) {
      return res.status(400).json({ 
        error: 'Missing required fields: problem and currentOrder' 
      });
    }
    
    const { correctOrder } = problem;
    
    if (!Array.isArray(currentOrder) || !Array.isArray(correctOrder)) {
      return res.status(400).json({ 
        error: 'Invalid data format' 
      });
    }
    
    // 첫 번째 잘못된 위치 찾기
    let firstErrorIndex = -1;
    for (let i = 0; i < Math.min(currentOrder.length, correctOrder.length); i++) {
      if (currentOrder[i]?.trim() !== correctOrder[i]?.trim()) {
        firstErrorIndex = i;
        break;
      }
    }
    
    let hint = '';
    if (firstErrorIndex === -1) {
      hint = '현재까지 순서가 정확합니다! 계속 진행하세요.';
    } else {
      hint = `${firstErrorIndex + 1}번째 라인의 위치를 다시 확인해보세요. 이 라인은 다른 위치에 있어야 합니다.`;
    }
    
    res.json({
      success: true,
      data: {
        hint,
        firstErrorIndex: firstErrorIndex === -1 ? null : firstErrorIndex,
        correctProgress: firstErrorIndex === -1 ? currentOrder.length : firstErrorIndex
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

module.exports = router;
