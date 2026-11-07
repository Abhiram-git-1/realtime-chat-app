const jwt = require("jsonwebtoken");
const Session = require("../models/Session");

const socketAuthenticate = async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;

    console.log("Socket authentication attempt");
    console.log("Token received:", Boolean(token));

    if (!token) {
      return next(new Error("Authentication required"));
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_ACCESS_SECRET,
    );

    if (!decoded.userId || !decoded.sessionId) {
      return next(new Error("Invalid access token"));
    }

    const session = await Session.findOne({
      _id: decoded.sessionId,
      user: decoded.userId,
      revokedAt: null,
    });

    if (!session) {
      return next(
        new Error("Session has been revoked or no longer exists"),
      );
    }

    if (
      session.expiresAt &&
      session.expiresAt <= new Date()
    ) {
      return next(new Error("Session has expired"));
    }

    socket.user = decoded;

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return next(new Error("Access token expired"));
    }

    if (error.name === "JsonWebTokenError") {
      return next(new Error("Invalid access token"));
    }

    console.error("Socket authentication error:", error);

    return next(new Error("Authentication failed"));
  }
};

module.exports = socketAuthenticate;