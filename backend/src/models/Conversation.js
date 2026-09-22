const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["direct", "group"],
      required: [true, "Conversation type is required"],
    },

    name: {
      type: String,
      trim: true,
      maxlength: 100,
      default: null,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Conversation creator is required"],
    },

    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
    
    lastMessageAt: {
      type: Date,
      default: null,
    },

    deletedAt: {
      type: Date,
      default: null,
    },
  },
  
  {
    timestamps: true,
  }
);
conversationSchema.index({ lastMessageAt: -1 });
const Conversation = mongoose.model(
  "Conversation",
  conversationSchema
);

module.exports = Conversation;