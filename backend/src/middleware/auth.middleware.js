const jwt = require("jsonwebtoken");
const Session = require("../models/Session");

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const [scheme, token] = authHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({
        success: false,
        message: "Invalid authorization header",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_ACCESS_SECRET,
    );

    if (!decoded.userId || !decoded.sessionId) {
      return res.status(401).json({
        success: false,
        message: "Invalid access token",
      });
    }

    const session = await Session.findOne({
      _id: decoded.sessionId,
      user: decoded.userId,
      revokedAt: null,
    });

    if (!session) {
      return res.status(401).json({
        success: false,
        message: "Session has been revoked or no longer exists",
      });
    }

    if (session.expiresAt && session.expiresAt <= new Date()) {
      return res.status(401).json({
        success: false,
        message: "Session has expired",
      });
    }

    req.user = decoded;

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Access token expired",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid access token",
      });
    }

    console.error("Authentication middleware error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

module.exports = authenticate;