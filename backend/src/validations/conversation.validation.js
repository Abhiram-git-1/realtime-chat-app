const Joi = require("joi");

const createConversationSchema = Joi.object({
  type: Joi.string().valid("direct", "group").required(),
  name: Joi.string().trim().min(1).max(100).allow("", null),
  memberIds: Joi.array()
  .items(
      Joi.string()
        .hex()
        .length(24)
    )
    .default([]),
});

const updateConversationSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required(),
});

const addMemberSchema = Joi.object({
  userId: Joi.string().hex().length(24).required(),
});

const updateMemberSchema = Joi.object({
  role: Joi.string().valid("admin", "member").required(),
});

module.exports = {
  createConversationSchema,
  updateConversationSchema,
  addMemberSchema,
  updateMemberSchema,
};