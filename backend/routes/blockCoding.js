//backend/routes/blockCoding.js - 블록코딩 문제 생성/검증/힌트 API

const express = require('express');
const router = express.Router();
const { generateBlockCodingProblem } = require('../services/openaiBlockCoding');

/**
 * 블록코딩 문제 생성 API
 * POST /api/block-coding/generate
 */
router.post('/generate', async (req, res) => {
  try {
    const { level = 0, topic = 'basic', language = 'javascript' } = req.body;
    
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

    console.log(`Generating block coding problem: Level ${level}, Topic: ${topic}, Language: ${language}`);
    
    // 블록코딩 문제 생성
    const problem = await generateBlockCodingProblem({ 
      level, 
      topic: topic.trim(), 
      language: language.toLowerCase() 
    });
    
    res.json({
      success: true,
      data: problem,
      message: 'Block coding problem generated successfully'
    });
    
  } catch (error) {
    console.error('Error generating block coding problem:', error);
    res.status(500).json({ 
      error: 'Failed to generate block coding problem',
      details: error.message 
    });
  }
});

/**
 * 블록코딩 문제 검증 API
 * POST /api/block-coding/validate
 */
router.post('/validate', async (req, res) => {
  try {
    const { problem, userAnswers } = req.body;
    
    if (!problem || !userAnswers) {
      return res.status(400).json({ 
        error: 'Missing required fields: problem and userAnswers' 
      });
    }
    
    // 정답 검증 로직
    const { blankedCode, keywordsToBlank } = problem;
    const correctAnswers = keywordsToBlank;
    
    let isCorrect = true;
    const results = [];
    
    // 각 블랭크에 대한 사용자 답안 검증
    for (let i = 0; i < correctAnswers.length; i++) {
      const userAnswer = userAnswers[i];
      const correctAnswer = correctAnswers[i];
      
      const isBlankCorrect = userAnswer && 
        userAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim();
      
      results.push({
        blankIndex: i + 1,
        userAnswer: userAnswer || '',
        correctAnswer,
        isCorrect: isBlankCorrect
      });
      
      if (!isBlankCorrect) {
        isCorrect = false;
      }
    }
    
    // 완성된 코드 생성 (사용자 답안으로)
    let completedCode = blankedCode;
    userAnswers.forEach((answer, index) => {
      const placeholder = `BLANK_${index + 1}`;
      completedCode = completedCode.replace(placeholder, answer || '');
    });
    
    res.json({
      success: true,
      data: {
        isCorrect,
        results,
        completedCode,
        score: Math.round((results.filter(r => r.isCorrect).length / results.length) * 100)
      },
      message: isCorrect ? 'All answers are correct!' : 'Some answers are incorrect.'
    });
    
  } catch (error) {
    console.error('Error validating block coding problem:', error);
    res.status(500).json({ 
      error: 'Failed to validate block coding problem',
      details: error.message 
    });
  }
});

/**
 * 블록코딩 문제 힌트 API
 * POST /api/block-coding/hint
 */
router.post('/hint', async (req, res) => {
  try {
    const { problem, blankIndex } = req.body;
    
    if (!problem || typeof blankIndex !== 'number') {
      return res.status(400).json({ 
        error: 'Missing required fields: problem and blankIndex' 
      });
    }
    
    const { keywordsToBlank, language } = problem;
    
    if (blankIndex < 1 || blankIndex > keywordsToBlank.length) {
      return res.status(400).json({ 
        error: `Invalid blankIndex. Must be between 1 and ${keywordsToBlank.length}` 
      });
    }
    
    const keyword = keywordsToBlank[blankIndex - 1];
    
    // 키워드 타입에 따른 힌트 생성
    let hint = '';
    if (['let', 'const', 'var'].includes(keyword)) {
      hint = '이 키워드는 변수를 선언할 때 사용됩니다.';
    } else if (['function', 'def'].includes(keyword)) {
      hint = '이 키워드는 함수를 정의할 때 사용됩니다.';
    } else if (['if', 'else', 'for', 'while'].includes(keyword)) {
      hint = '이 키워드는 조건문이나 반복문을 만들 때 사용됩니다.';
    } else if (['return'].includes(keyword)) {
      hint = '이 키워드는 함수에서 값을 반환할 때 사용됩니다.';
    } else if (['console', 'print'].includes(keyword)) {
      hint = '이 키워드는 화면에 출력할 때 사용됩니다.';
    } else if (['+', '-', '*', '/', '='].includes(keyword)) {
      hint = '이 키워드는 연산을 수행할 때 사용됩니다.';
    } else {
      hint = `이 키워드는 ${language} 프로그래밍에서 자주 사용되는 기본 키워드입니다.`;
    }
    
    res.json({
      success: true,
      data: {
        hint,
        keyword,
        blankIndex
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
