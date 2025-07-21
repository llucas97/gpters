// auth/middleware.js
const jwt = require('jsonwebtoken');
const secret = process.env.JWT_SECRET;

// 🔹 JWT 생성기 (다른 파일에서 사용 가능하게 exports)
exports.generateToken = (user) => {
  return jwt.sign({ email: user.email, id: user.user_id }, secret, { expiresIn: '1h' });
};

// 🔹 JWT 검증 함수 (verifyToken 함수)
exports.verifyToken = (token) => {
  try {
    return jwt.verify(token, secret);
  } catch (err) {
    return null;
  }
};

// 🔹 JWT 인증 미들웨어
exports.verifyTokenMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: '인증 토큰이 필요합니다.' });
  }

  const token = authHeader.split(' ')[1];
  const user = exports.verifyToken(token);

  if (!user) {
    return res.status(401).json({ message: '유효하지 않은 토큰입니다.' });
  }

  req.user = user;
  next();
};
