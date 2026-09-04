const jwt = require("jsonwebtoken");

const generateAccessToken = (user, sessionId) => {
  return jwt.sign(
    {
      userId: user._id.toString(),
      role: user.role,
      sessionId: sessionId.toString(),

    },
    process.env.JWT_ACCESS_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || "15m",
    }
  );
};

const generateRefreshToken = (user, sessionId) => {
  return jwt.sign(
    {
      userId: user._id.toString(),
      sessionId: sessionId.toString(),
    },
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d",
    }
  );
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
};