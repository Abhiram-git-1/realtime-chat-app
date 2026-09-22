const mongoose = require("mongoose");

const conversationMemberSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: [true, "Conversation is required"],
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
    },

    role: {
      type: String,
      enum: ["admin", "member"],
      default: "member",
    },

    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

conversationMemberSchema.index(
  {
    userId: 1,
    conversationId: 1,
  },
  {
    unique: true,
  }
);

const ConversationMember = mongoose.model(
  "ConversationMember",
  conversationMemberSchema
);

module.exports = ConversationMember;