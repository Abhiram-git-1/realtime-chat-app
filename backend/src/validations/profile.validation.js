const joi = require("joi");

const updateProfileSchema = Joi.object({
  name: Joi.string().trim().min(3).max(50),
  username: Joi.string().trim().lowercase().min(3).max(30).pattern(/^[a-zA-Z0-9_]+$/),
  avatar: Joi.string().allow(null, ""),
  bio: Joi.string().max(160).allow(""),
}).min(1);

module.exports = {
  updateProfileSchema,
};