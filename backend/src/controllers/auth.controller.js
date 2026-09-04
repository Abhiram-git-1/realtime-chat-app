const bcrypt = require("bcryptjs");

const User = require("../models/User");
const Session = require("../models/Session");
const jwt = require("jsonwebtoken");

const { generateOTP } = require("../utils/otp");
const { sendVerificationOTP, sendPasswordResetOTP } = require("../services/email.service");
const { generateAccessToken, generateRefreshToken } = require("../utils/token");
const { hashToken } = require("../utils/hash");
const register = async (req, res) => {
  try {
    const { name, username, email, password } = req.body;

    if (!name || !username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, username, email and password are required",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }
    const normalizedUsername = username.toLowerCase();
    const normalizedEmail = email.toLowerCase();
    const existingUser = await User.findOne({
      $or: [
        { email: normalizedEmail },
        { username: normalizedUsername },
      ],
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email or username already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const otp = generateOTP();
    const hashedOTP = await bcrypt.hash(otp, 10);
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
    const user = await User.create({
      name,
      username: normalizedUsername,
      email: normalizedEmail,
      password: hashedPassword,
      
      emailVerificationOTP: hashedOTP,
      emailVerificationOTPExpires: otpExpires,
      emailVerificationOTPAttempts: 0,
      emailVerificationOTPLastSentAt: new Date(),
    });

    await sendVerificationOTP(email, otp);
    return res.status(201).json({
      success: true,
      message: "Account created. Verification OTP sent to your email.",
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (error) {
    console.error("Register error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    }).select(
      "+emailVerificationOTP +emailVerificationOTPExpires +emailVerificationOTPAttempts +emailVerificationOTPLastSentAt"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: "Email is already verified",
      });
    }

    if (
      !user.emailVerificationOTP ||
      !user.emailVerificationOTPExpires
    ) {
      return res.status(400).json({
        success: false,
        message: "Verification OTP not found",
      });
    }

    if (user.emailVerificationOTPExpires < new Date()) {
      return res.status(400).json({
        success: false,
        message: "Verification OTP has expired",
      });
    }

    if (user.emailVerificationOTPAttempts >= 5){
      return res.status(429).json({
        success: false,
        message: "Too many attempts. Please request a new OTP.",
      });
    }

    const isOTPValid = await bcrypt.compare(
      otp,
      user.emailVerificationOTP
    );

    if (!isOTPValid) {
      user.emailVerificationOTPAttempts += 1;
      await user.save();
      return res.status(400).json({
        success: false,
        message: "Invalid verification OTP",
      });
    }

    user.isEmailVerified = true;
    user.emailVerificationOTP = null;
    user.emailVerificationOTPExpires = null;
    user.emailVerificationOTPAttempts = 0;
    user.emailVerificationOTPLastSentAt = null;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error) {
    console.error("Verify email error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

const resendVerificationOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({
      email: normalizedEmail,
    }).select(
      "+emailVerificationOTP +emailVerificationOTPExpires +emailVerificationOTPAttempts +emailVerificationOTPLastSentAt"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: "Email is already verified",
      });
    }

    if(user.emailVerificationOTPLastSentAt &&
       Date.now() - user.emailVerificationOTPLastSentAt.getTime() < 60*1000){
        return res.status(429).json({
          success: false,
          message: "Please wait before requesting another OTP.",
        });
    }

    // Generate new OTP
    const otp = generateOTP();

    // Hash OTP before storing
    const hashedOTP = await bcrypt.hash(otp, 10);

    // OTP expires in 10 minutes
    const otpExpires = new Date(
      Date.now() + 10 * 60 * 1000
    );
    // Replace old OTP
    user.emailVerificationOTP = hashedOTP;
    user.emailVerificationOTPExpires = otpExpires;
     // New OTP gets a fresh attempt count
    user.emailVerificationOTPAttempts = 0;
    user.emailVerificationOTPLastSentAt = new Date();
    await user.save();

    // Send new OTP
    await sendVerificationOTP(user.email, otp);

    return res.status(200).json({
      success: true,
      message: "Verification OTP resent successfully",
    });
  } catch (error) {
    console.error("Resend verification OTP error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // password is select:false, so explicitly include it
    const user = await User.findOne({
      email: normalizedEmail,
    }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (user.accountStatus !== "active") {
      return res.status(403).json({
        success: false,
        message: "Account is not active",
      });
    }

    if (!user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email before logging in",
      });
    }

    const isPasswordCorrect = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Create session first
    const session = await Session.create({
      user: user._id,
      refreshTokenHash: "temporary",
      device: req.headers["user-agent"] || "Unknown device",
      userAgent: req.headers["user-agent"] || null,
      ipAddress: req.ip,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    // Generate tokens
    const accessToken = generateAccessToken(user, session._id);

    const refreshToken = generateRefreshToken(
      user,
      session._id
    );

    // Store only hash of refresh token
    session.refreshTokenHash = hashToken(refreshToken);

    await session.save();

    // Update login time
    user.lastLoginAt = new Date();

    await user.save();

    // Send refresh token using HttpOnly cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      //path: "/auth/refresh-token", // restrict cookie to refresh token route, generally path is set to "/" to allow access from all routes.
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

const refreshToken = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Refresh token not found",
      });
    }

    let decoded;

    try {
      decoded = jwt.verify(
        token,
        process.env.JWT_REFRESH_SECRET
      );
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired refresh token",
      });
    }

    const { userId, sessionId } = decoded;

    const session = await Session.findOne({
      _id: sessionId,
      user: userId,
      revokedAt: null,
    }).select("+refreshTokenHash");

    if (!session) {
      return res.status(401).json({
        success: false,
        message: "Session is invalid or revoked",
      });
    }

    if (session.expiresAt < new Date()) {
      session.revokedAt = new Date();
      await session.save();

      // Delete refresh token cookie
      res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });
      return res.status(401).json({
        success: false,
        message: "Session has expired",
      });
    }

    const storedTokenHash = session.refreshTokenHash;

    const incomingTokenHash = hashToken(token);

    if (storedTokenHash !== incomingTokenHash) {
      // Possible refresh-token reuse
      session.revokedAt = new Date();
      await session.save();

      return res.status(401).json({
        success: false,
        message: "Invalid refresh token",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User no longer exists",
      });
    }

    if (user.accountStatus !== "active") {
      return res.status(403).json({
        success: false,
        message: "Account is not active",
      });
    }

    // Generate new tokens
    const newAccessToken = generateAccessToken(user, session._id);

    const newRefreshToken = generateRefreshToken(
      user,
      session._id
    );

    // Rotate refresh token
    session.refreshTokenHash = hashToken(newRefreshToken);

    await session.save();

    // Send new refresh token
    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
      accessToken: newAccessToken,
    });
  } catch (error) {
    console.error("Refresh token error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

const logout = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;

    // Even if there is no cookie, make logout idempotent.
    if (!token) {
      return res.status(200).json({
        success: true,
        message: "Logged out successfully",
      });
    }

    let decoded;

    try {
      decoded = jwt.verify(
        token,
        process.env.JWT_REFRESH_SECRET
      );
    } catch (error) {
      // Token is already invalid/expired.
      // Clear the cookie anyway.
      res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });

      return res.status(200).json({
        success: true,
        message: "Logged out successfully",
      });
    }

    const { sessionId } = decoded;

    await Session.findOneAndUpdate(
      {
        _id: sessionId,
        revokedAt: null,
      },
      {
        revokedAt: new Date(),
      }
    );

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

const logoutAll = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    let decoded;

    try {
      decoded = jwt.verify(
        token,
        process.env.JWT_REFRESH_SECRET
      );
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired refresh token",
      });
    }

    const { userId } = decoded;

    const result = await Session.updateMany(
      {
        user: userId,
        revokedAt: null,
      },
      {
        revokedAt: new Date(),
      }
    );

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    return res.status(200).json({
      success: true,
      message: "Logged out from all devices",
      sessionsRevoked: result.modifiedCount,
    });
  } catch (error) {
    console.error("Logout all error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        role: user.role,
        accountStatus: user.accountStatus,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
      },
    });
  } catch (error) {
    console.error("Get current user error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({
      email: normalizedEmail,
    }).select(
      "+passwordResetOTP +passwordResetOTPExpires +passwordResetOTPAttempts"
    );

    /*
      We intentionally return the same response whether
      the email exists or not.

      This prevents account enumeration.
    */    

    if (!user) {
      return res.status(200).json({
        success: true,
        message:
          "If an account exists with this email, a password reset OTP has been sent.",
      });
    }

    if (user.accountStatus !== "active") {
      return res.status(200).json({
        success: true,
        message:
          "If an account exists with this email, a password reset OTP has been sent.",
      });
    }

    /*
      If a valid reset OTP already exists for 10mins,
      don't generate another one.

      The user can use /resend-reset-otp
      if they need a new OTP.
    */
    const hasActiveResetOTP =
      user.passwordResetOTP &&
      user.passwordResetOTPExpires &&
      user.passwordResetOTPExpires > new Date();

    if (hasActiveResetOTP) {
      return res.status(200).json({
        success: true,
        message:
          "If an account exists with this email, a password reset OTP has been sent.",
      });
    }

    const otp = generateOTP();

    const hashedOTP = await bcrypt.hash(otp, 10);

    const otpExpires = new Date(
      Date.now() + 10 * 60 * 1000
    );

    user.passwordResetOTP = hashedOTP;
    user.passwordResetOTPExpires = otpExpires;
    user.passwordResetOTPAttempts = 0;
    user.passwordResetOTPLastSentAt = new Date();

    // new reset process
    user.isPasswordResetVerified = false;

    await user.save();

    await sendPasswordResetOTP(
      user.email,
      otp
    );

    return res.status(200).json({
      success: true,
      message:
        "If an account exists with this email, a password reset OTP has been sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

const verifyResetOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({
      email: normalizedEmail,
    }).select(
      "+passwordResetOTP +passwordResetOTPExpires +passwordResetOTPAttempts +passwordResetOTPLastSentAt"
    );

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset OTP",
      });
    }

    if (
      !user.passwordResetOTP ||
      !user.passwordResetOTPExpires
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset OTP",
      });
    }

    if (user.passwordResetOTPExpires < new Date()) {
      return res.status(400).json({
        success: false,
        message: "Reset OTP has expired",
      });
    }

    if (user.passwordResetOTPAttempts >= 5){
      return res.status(400).json({
        success: false,
        message: "Too Many incorrect attempts",
      });
    }

    const isOTPValid = await bcrypt.compare(
      otp,
      user.passwordResetOTP
    );

    if (!isOTPValid) {
      user.passwordResetOTPAttempts += 1;

      await user.save();
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset OTP",
      });
    }

    user.isPasswordResetVerified = true;
    user.passwordResetOTP = null;
    user.passwordResetOTPExpires = null;
    user.passwordResetOTPAttempts = 0;
    user.passwordResetOTPLastSentAt = null;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Reset OTP verified successfully",
    });
  } catch (error) {
    console.error("Verify reset OTP error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

const resendResetOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({
      email: normalizedEmail,
    }).select(
      "+passwordResetOTP +passwordResetOTPExpires +passwordResetOTPAttempts +passwordResetOTPLastSentAt"
    );

    // Don't reveal whether an account exists
    if (!user) {
      return res.status(200).json({
        success: true,
        message:
          "If an account exists with this email, a new reset OTP has been sent.",
      });
    }

    if (user.accountStatus !== "active") {
      return res.status(200).json({
        success: true,
        message:
          "If an account exists with this email, a new reset OTP has been sent.",
      });
    }

    if (user.passwordResetOTPLastSentAt && new Date() - user.passwordResetOTPLastSentAt < 60*1000) {
      return res.status(429).json({
        success: false,
        message: "Please wait before requesting a new reset OTP",
      });
    }

    // Generate new OTP
    const otp = generateOTP();

    // Hash before storing
    const hashedOTP = await bcrypt.hash(otp, 10);

    // New expiry: 10 minutes
    const otpExpires = new Date(
      Date.now() + 10 * 60 * 1000
    );

    user.passwordResetOTP = hashedOTP;
    user.passwordResetOTPExpires = otpExpires;

    user.passwordResetOTPAttempts = 0;
    user.passwordResetOTPLastSentAt = new Date();
    // New OTP means previous verification is invalid
    user.isPasswordResetVerified = false;

    await user.save();

    await sendPasswordResetOTP(
      user.email,
      otp
    );

    return res.status(200).json({
      success: true,
      message:
        "If an account exists with this email, a new reset OTP has been sent.",
    });
  } catch (error) {
    console.error("Resend reset OTP error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Email and new password are required",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({
      email: normalizedEmail,
    }).select("+password +passwordResetOTP +passwordResetOTPExpires +passwordResetOTPAttempts +passwordResetOTPLastSentAt");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Unable to reset password",
      });
    }

    // OTP must have been verified first
    if (!user.isPasswordResetVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify the reset OTP first",
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(
      newPassword,
      12
    );

    user.password = hashedPassword;
    user.passwordChangedAt = new Date();
    // Clear password-reset state
    user.passwordResetOTP = null;
    user.passwordResetOTPExpires = null;
    user.passwordResetOTPAttempts = 0;
    user.passwordResetOTPLastSentAt = null;
    user.isPasswordResetVerified = false;

    await user.save();

    // Revoke every existing session
    await Session.updateMany(
      {
        user: user._id,
        revokedAt: null,
      },
      {
        revokedAt: new Date(),
      }
    );

    // Clear current refresh-token cookie
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    return res.status(200).json({
      success: true,
      message:
        "Password reset successfully. Please login again.",
    });
  } catch (error) {
    console.error("Reset password error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message:
          "Current password and new password are required",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message:
          "New password must be at least 8 characters long",
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message:
          "New password must be different from current password",
      });
    }

    const user = await User.findById(
      req.user.userId
    ).select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isCurrentPasswordCorrect =
      await bcrypt.compare(
        currentPassword,
        user.password
      );

    if (!isCurrentPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    const hashedPassword = await bcrypt.hash(
      newPassword,
      12
    );

    user.password = hashedPassword;

    await user.save();

    // Revoke all existing sessions
    await Session.updateMany(
      {
        user: user._id,
        revokedAt: null,
      },
      {
        revokedAt: new Date(),
      }
    );

    // Remove current refresh-token cookie
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    return res.status(200).json({
      success: true,
      message:
        "Password changed successfully. Please login again.",
    });
  } catch (error) {
    console.error("Change password error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

const googleCallback = async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Google authentication failed",
      });
    }
    if (user.accountStatus !== "active") {
      return res.status(403).json({
        success: false,
        message: "Account is not active",
      });
    }
    // Create a new application session
    const session = await Session.create({
      user: user._id,
      refreshTokenHash: "temporary",
      device: req.headers["user-agent"] || "Unknown device",
      userAgent: req.headers["user-agent"] || null,
      ipAddress: req.ip,
      expiresAt: new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000
      ),
    });

    // Generate our normal JWT tokens
    const accessToken = generateAccessToken(user, session._id);

    const refreshToken = generateRefreshToken(
      user,
      session._id
    );

    // Store only the hash
    session.refreshTokenHash =
      hashToken(refreshToken);

    await session.save();

    user.lastLoginAt = new Date();

    await user.save();

    // Refresh token goes into HttpOnly cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    /*
      For now return the access token as JSON.

      Later, when our React frontend exists,
      this can redirect to the frontend with
      a safer token-delivery architecture.
    */

    return res.status(200).json({
      success: true,
      message: "Google login successful",
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (error) {
    console.error("Google callback error:", error);

    return res.status(500).json({
      success: false,
      message: "Google authentication failed",
    });
  }
};

const getSessions = async (req, res) => {
  try {
    const sessions = await Session.find({
      user: req.user.userId,
      revokedAt: null,
    })
      .select(
        "_id device userAgent ipAddress createdAt lastUsedAt expiresAt"
      )
      .sort({
        createdAt: -1,
      });

      const formattedSessions = sessions.map(
      (session) => ({
        id: session._id,
        device: session.device,
        userAgent: session.userAgent,
        ipAddress: session.ipAddress,
        createdAt: session.createdAt,
        lastUsedAt: session.lastUsedAt,
        expiresAt: session.expiresAt,
        revokedAt: session.revokedAt,
        current:
          session._id.toString() ===
          req.user.sessionId.toString(),
      })
    );

    return res.status(200).json({
      success: true,
      sessions: formattedSessions,
    });
  } catch (error) {
    console.error("Get sessions error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

const revokeSession = async (req, res) => {
  try {
    const { id } = req.params;
    //prevent a user from accidentally revoking their current session through the revoke remote session endpoint. They should use the logout endpoint instead.
    if (id == req.user.sessionId) {
      return res.status(400).json({
        success: false,
        message: "Cannot revoke current session instead use logout",
      });
    }
    const session = await Session.findOne({
      _id: id,
      user: req.user.userId,
      revokedAt: null,
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      });
    }

    session.revokedAt = new Date();

    await session.save();

    return res.status(200).json({
      success: true,
      message: "Session revoked successfully",
    });
  } catch (error) {
    console.error("Revoke session error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

/*const getEmailVerificationStatus = async (req, res) => {
  try{
    const user = await User.findById(
      req.user.userId
    ).select("isEmailVerified");
    if(!user){
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    return res.status(200).json({
      success: true,
      email:user.email,
      isEmailVerified: user.isEmailVerified,
    });
  }catch(error){
    console.error("Get email verification status error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};
*/
module.exports = {
  register,
  verifyEmail,
  resendVerificationOTP,
  login,
  refreshToken,
  logout,
  logoutAll,
  getMe,
  forgotPassword,
  verifyResetOTP,
  resendResetOTP,
  resetPassword,
  changePassword,
  googleCallback,
  getSessions,
  revokeSession,
  //getEmailVerificationStatus,
};