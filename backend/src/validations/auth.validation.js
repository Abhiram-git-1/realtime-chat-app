const Joi = require("joi");

const registerSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(3)
    .max(50)
    .required(),

  username: Joi.string()
    .trim()
    .lowercase()
    .min(3)
    .max(30)
    .pattern(/^[a-zA-Z0-9_]+$/)
    .required(),

  email: Joi.string()
    .trim()
    .lowercase()
    .email()
    .required(),

  password: Joi.string()
    .min(8)
    .max(128)
    .required(),
});

const loginSchema = Joi.object({
  email: Joi.string()
    .trim()
    .lowercase()
    .email()
    .required(),

  password: Joi.string()
    .required(),
});

const verifyEmailSchema = Joi.object({
  email: Joi.string()
    .trim()
    .lowercase()
    .email()
    .required(),

  otp: Joi.string()
    .trim()
    .pattern(/^\d{6}$/)
    .required(),
});

const resendVerificationOTPSchema = Joi.object({
  email: Joi.string()
    .trim()
    .lowercase()
    .email()
    .required(),
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string()
    .trim()
    .lowercase()
    .email()
    .required(),
});

const verifyResetOTPSchema = Joi.object({
  email: Joi.string()
    .trim()
    .lowercase()
    .email()
    .required(),

  otp: Joi.string()
    .trim()
    .pattern(/^\d{6}$/)
    .required(),
});

const resendResetOTPSchema = Joi.object({
  email: Joi.string()
    .trim()
    .lowercase()
    .email()
    .required(),
});

const resetPasswordSchema = Joi.object({
  email: Joi.string()
    .trim()
    .lowercase()
    .email()
    .required(),

  newPassword: Joi.string()
    .min(8)
    .max(128)
    .required(),
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string()
    .required(),

  newPassword: Joi.string()
    .min(8)
    .max(128)
    .invalid(Joi.ref("currentPassword"))
    .required()
    .messages({
      "any.invalid":
        "New password must be different from current password",
    }),
});

module.exports = {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  resendVerificationOTPSchema,
  forgotPasswordSchema,
  verifyResetOTPSchema,
  resendResetOTPSchema,
  resetPasswordSchema,
  changePasswordSchema,
};