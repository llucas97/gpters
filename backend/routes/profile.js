const express = require('express');
const { body, validationResult } = require('express-validator');
const { query, transaction } = require('../config/database');

const router = express.Router();

// 프로필 유효성 검사 규칙
const profileValidation = [
  body('username')
    .optional()
    .isLength({ min: 3, max: 30 })
    .withMessage('사용자명은 3자 이상 30자 이하여야 합니다')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('사용자명은 영문, 숫자, 언더스코어만 사용 가능합니다'),
  
  body('name')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('이름은 1자 이상 100자 이하여야 합니다'),
  
  body('email')
    .optional()
    .isEmail()
    .withMessage('유효한 이메일 주소를 입력해주세요'),
  
  body('bio')
    .optional()
    .isLength({ max: 500 })
    .withMessage('자기소개는 500자 이하여야 합니다'),
  
  body('location')
    .optional()
    .isLength({ max: 100 })
    .withMessage('위치는 100자 이하여야 합니다'),
  
  body('website')
    .optional()
    .isURL()
    .withMessage('유효한 웹사이트 URL을 입력해주세요')
];

// GET /api/profile/:userId - 사용자 프로필 조회
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const profile = await query(
      `SELECT id, username, email, name, bio, location, website, profile_image_url,
              survey_completed, created_at, updated_at
       FROM users 
       WHERE id = ?`,
      [userId]
    );

    if (profile.length === 0) {
      return res.status(404).json({
        success: false,
        message: '사용자 프로필을 찾을 수 없습니다'
      });
    }

    // 설문조사 정보도 함께 조회
    const surveyInfo = await query(
      `SELECT id, occupation, purpose, level, completed_at
       FROM user_surveys 
       WHERE user_id = ? 
       ORDER BY completed_at DESC 
       LIMIT 1`,
      [userId]
    );

    res.json({
      success: true,
      data: {
        ...profile[0],
        survey: surveyInfo[0] || null
      }
    });

  } catch (error) {
    console.error('Profile retrieval error:', error);
    res.status(500).json({
      success: false,
      message: '프로필 조회 중 오류가 발생했습니다',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// PUT /api/profile/:userId - 사용자 프로필 수정
router.put('/:userId', profileValidation, async (req, res) => {
  try {
    // 유효성 검사 결과 확인
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '입력 데이터가 유효하지 않습니다',
        errors: errors.array()
      });
    }

    const { userId } = req.params;
    const { username, name, email, bio, location, website, profileImage } = req.body;

    // 사용자 존재 확인
    const existingUser = await query(
      'SELECT id FROM users WHERE id = ?',
      [userId]
    );

    if (existingUser.length === 0) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다'
      });
    }

    // 사용자명 중복 확인 (변경하는 경우)
    if (username) {
      const duplicateUsername = await query(
        'SELECT id FROM users WHERE username = ? AND id != ?',
        [username, userId]
      );

      if (duplicateUsername.length > 0) {
        return res.status(409).json({
          success: false,
          message: '이미 사용 중인 사용자명입니다'
        });
      }
    }

    // 이메일 중복 확인 (변경하는 경우)
    if (email) {
      const duplicateEmail = await query(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [email, userId]
      );

      if (duplicateEmail.length > 0) {
        return res.status(409).json({
          success: false,
          message: '이미 사용 중인 이메일입니다'
        });
      }
    }

    // 프로필 업데이트
    const updateFields = [];
    const updateValues = [];

    if (username !== undefined) {
      updateFields.push('username = ?');
      updateValues.push(username);
    }
    if (name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(name);
    }
    if (email !== undefined) {
      updateFields.push('email = ?');
      updateValues.push(email);
    }
    if (bio !== undefined) {
      updateFields.push('bio = ?');
      updateValues.push(bio);
    }
    if (location !== undefined) {
      updateFields.push('location = ?');
      updateValues.push(location);
    }
    if (website !== undefined) {
      updateFields.push('website = ?');
      updateValues.push(website);
    }
    if (profileImage !== undefined) {
      updateFields.push('profile_image_url = ?');
      updateValues.push(profileImage);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: '업데이트할 필드가 없습니다'
      });
    }

    updateFields.push('updated_at = NOW()');
    updateValues.push(userId);

    await query(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    // 업데이트된 프로필 조회
    const updatedProfile = await query(
      `SELECT id, username, email, name, bio, location, website, profile_image_url,
              survey_completed, created_at, updated_at
       FROM users 
       WHERE id = ?`,
      [userId]
    );

    res.json({
      success: true,
      message: '프로필이 성공적으로 업데이트되었습니다',
      data: updatedProfile[0]
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      message: '프로필 업데이트 중 오류가 발생했습니다',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /api/profile/:userId/upload-image - 프로필 이미지 업로드
router.post('/:userId/upload-image', async (req, res) => {
  try {
    const { userId } = req.params;
    const { imageData, imageType } = req.body;

    if (!imageData) {
      return res.status(400).json({
        success: false,
        message: '이미지 데이터가 필요합니다'
      });
    }

    // 실제 환경에서는 AWS S3, Cloudinary 등에 업로드
    // 현재는 임시로 base64 데이터를 그대로 저장
    const imageUrl = imageData; // 실제로는 업로드된 이미지 URL

    await query(
      'UPDATE users SET profile_image_url = ?, updated_at = NOW() WHERE id = ?',
      [imageUrl, userId]
    );

    res.json({
      success: true,
      message: '프로필 이미지가 성공적으로 업로드되었습니다',
      data: {
        imageUrl
      }
    });

  } catch (error) {
    console.error('Profile image upload error:', error);
    res.status(500).json({
      success: false,
      message: '프로필 이미지 업로드 중 오류가 발생했습니다',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// DELETE /api/profile/:userId/image - 프로필 이미지 삭제
router.delete('/:userId/image', async (req, res) => {
  try {
    const { userId } = req.params;

    await query(
      'UPDATE users SET profile_image_url = NULL, updated_at = NOW() WHERE id = ?',
      [userId]
    );

    res.json({
      success: true,
      message: '프로필 이미지가 삭제되었습니다'
    });

  } catch (error) {
    console.error('Profile image deletion error:', error);
    res.status(500).json({
      success: false,
      message: '프로필 이미지 삭제 중 오류가 발생했습니다',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router; 