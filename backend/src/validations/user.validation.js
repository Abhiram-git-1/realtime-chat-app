const Joi = require("joi");

const updateUserSchema = Joi.object({
  name: Joi.string().trim().min(3).max(50),
  username: Joi.string().trim().lowercase().min(3).max(30).pattern(/^[a-zA-Z0-9_]+$/),
  avatar: Joi.string().allow(null, ""),
  bio: Joi.string().max(160).allow(""),
}).min(1); // req cannot contain an empty {} body

module.exports = {
  updateUserSchema,
};