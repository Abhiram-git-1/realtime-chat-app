const Joi = require("joi");

const createMessageSchema = Joi.object({
  content: Joi.string().trim().min(1).max(5000).required(),
});

const updateMessageSchema = Joi.object({
  content: Joi.string().trim().min(1).max(5000).required(),
});

module.exports = {
  createMessageSchema,
  updateMessageSchema,
};