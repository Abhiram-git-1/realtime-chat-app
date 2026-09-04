const rateLimit = require("express-rate-limit");
//For each client/key (ip), keep track of requests during a 15-minute window and don't allow more than 100 requests in that window.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,

  max: 100,

  standardHeaders: true,

  legacyHeaders: false,

  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});

const strictAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,

  max: 10,

  standardHeaders: true,

  legacyHeaders: false,

  message: {
    success: false,
    message: "Too many authentication attempts. Please try again later.",
  },
});

module.exports = {
  authLimiter,
  strictAuthLimiter,
};