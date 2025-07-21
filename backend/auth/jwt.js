const jwt = require('jsonwebtoken');
const secret = process.env.JWT_SECRET;

function generateToken(user) {
  return jwt.sign(
    { email: user.email, id: user.user_id },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
}


function verifyToken(token) {
  try {
    return jwt.verify(token, secret);
  } catch (err) {
    return null;
  }
}

module.exports = {
  generateToken,
  verifyToken
};

