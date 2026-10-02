const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: [true, "Conversation is required"],
    },

    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Sender is required"],
    },

    content: {
      type: String,
      required: [true, "Message content is required"],
      trim: true,
      maxlength: 5000,
    },

    deletedAt: {
      type: Date,
      default: null,
    },

    deliveryStatus: [
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        deliveredAt: {
            type: Date,
            default: null,
        },

        readAt:{
            type: Date,
            default: null
        }
    },
    ],
  },
  {
    timestamps: true,
  }
);

messageSchema.index({
    conversationId: 1,
    createdAt: -1,
});

const Message = mongoose.model("Message", messageSchema);

module.exports = Message;