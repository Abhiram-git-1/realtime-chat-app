const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: 3,
      maxlength: 50,
    },

    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 30,
      match: [
        /^[a-zA-Z0-9_]+$/,
        "Username can only contain letters, numbers and underscores",
      ],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      minlength: 8,
      select: false,
      default: null,
    },

    avatar: {
      type: String,
      default: null,
    },

    bio: {
      type: String,
      maxlength: 160,
      default: "",
    },

    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    emailVerificationOTP: {
      type: String,
      select: false,
      default: null,
    },

    emailVerificationOTPExpires: {
      type: Date,
      select: false,
      default: null,
    },
    emailVerificationOTPAttempts: {
      type: Number,
      select: false,
      default: 0,
    },
    emailVerificationOTPLastSentAt: {
      type: Date,
      select: false,
      default: null,
    },
    passwordResetOTP: {
      type: String,
      select: false,
      default: null,
    },

    passwordResetOTPExpires: {
      type: Date,
      select: false,
      default: null,
    },

    passwordResetOTPAttempts: {
      type: Number,
      select: false,
      default: 0,
    },

    passwordResetOTPLastSentAt: {
      type: Date,
      select: false,
      default: null,
    },
    
    isPasswordResetVerified: {
      type: Boolean,
      default: false,
    },
    
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },

    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    accountStatus: {
      type: String,
      enum: ["active", "suspended", "disabled"],
      default: "active",
    },

    passwordChangedAt: {
      type: Date,
      default: null,
    },

    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

module.exports = User;