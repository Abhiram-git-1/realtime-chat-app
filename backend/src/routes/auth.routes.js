const express = require("express");
const passport = require("../config/passport");
const { register, verifyEmail, resendVerificationOTP, login, refreshToken, logout, logoutAll, getMe, forgotPassword, verifyResetOTP, resendResetOTP, resetPassword, changePassword, googleCallback, getSessions, revokeSession, } = require("../controllers/auth.controller");
const authenticate = require("../middleware/auth.middleware");
const { authLimiter, strictAuthLimiter } = require("../middleware/ratelimit.middleware");

const validate = require("../middleware/validate.middleware");
const {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  resendVerificationOTPSchema,
  forgotPasswordSchema,
  verifyResetOTPSchema,
  resendResetOTPSchema,
  resetPasswordSchema,
  changePasswordSchema,
} = require("../validations/auth.validation");

const router = express.Router();

router.post("/register", authLimiter, validate(registerSchema), register);
router.post("/verify-email", strictAuthLimiter, validate(verifyEmailSchema), verifyEmail);
router.post("/resend-verification-otp", strictAuthLimiter, validate(resendVerificationOTPSchema), resendVerificationOTP);// not verified user can request a new OTP to be sent to their email mulptiple times so need "ratelimiting"
router.post("/login", strictAuthLimiter, validate(loginSchema), login);
router.post("/refresh-token", refreshToken);
router.post("/logout", logout);
router.post("/logout-all", logoutAll);
router.get("/me", authenticate, getMe);
router.post("/forgot-password", strictAuthLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post("/verify-reset-otp", strictAuthLimiter, validate(verifyResetOTPSchema), verifyResetOTP);
router.post("/resend-reset-otp", strictAuthLimiter, validate(resendResetOTPSchema), resendResetOTP);
router.post("/reset-password", validate(resetPasswordSchema), resetPassword); 
/** We're currently storing:
isPasswordResetVerified: true
directly on the user.
That works for our first implementation, but later we'll improve the reset flow so the verification state is represented by a short-lived reset credential/token, rather than a persistent boolean. */
router.post("/change-password", authenticate, validate(changePasswordSchema), changePassword);
router.get(
    "/google", 
    passport.authenticate("google", {
         scope: ["profile", "email"], 
         session: false
        })
);
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/auth/google/failure",
    session: false,
  }),
  googleCallback
);
router.get("/sessions", authenticate, getSessions);
router.delete("/sessions/:id", authenticate, revokeSession);
// router.get("/verify-email/status", authenticate, getEmailVerificationStatus);
module.exports = router;