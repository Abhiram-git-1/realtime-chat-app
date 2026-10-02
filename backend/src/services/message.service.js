const Message = require("../models/Message");
const Conversation = require("../models/Conversation");
const ConversationMember = require("../models/ConversationMember");
/*const getConversationMessages = async(conversationId)=>{
    const messages = await Message.find({
        conversationId,
    }).sort({createdAt: -1}).populate("senderId", "_id name username avatar");

    return messages; // gets deleted messages also, handle it by hiding 
};
*/

const getConversationMessages = async (conversationId) => {
  const messages = await Message.find({
    conversationId,
  })
    .sort({ createdAt: -1 })
    .populate("senderId", "_id name username avatar")
    .lean();

  return messages.map((message) => {
    if (message.deletedAt) {
      return {
        ...message,
        content: null,
      };
    }
    // deleted message statys in histroy with content = null
    return message;
    /** o the message stays in the conversation history, but its original content is no longer exposed.
     * Your frontend can use:
     * if (message.deletedAt) {
     * // display "This message was deleted"
     * }
     *  */
  });
};
const createMessage = async ({ conversationId, senderId, content }) => {
  //get all members expect the sender
  const members = await ConversationMember.find({
    conversationId,
    userId: { $ne: senderId },
  }).select("userId");

  const deliveryStatus = members.map((member) => ({
    userId: member.userId,
    deliveredAt: null,
  }));

  //create message with delivery tracking
  const message = await Message.create({
    conversationId,
    senderId,
    content,
    deliveryStatus,
  });

  await Conversation.findByIdAndUpdate(conversationId, {
    lastMessage: message._id,
    lastMessageAt: message.createdAt,
  });

  return message;
};
const markMessagesAsRead = async ({ conversationId, userId }) => {
  const unreadMessages = await Message.find({
    conversationId,
    deliveryStatus: {
      $elemMatch: {
        userId,
        readAt: null,
      },
    },
  }).select("_id deliveryStatus");

  console.log(
    "Unread messages found:",
    unreadMessages.length,
    "for user:",
    userId,
  );

  if (unreadMessages.length === 0) {
    return {
      messageIds: [],
      readAt: null,
    };
  }

  const readAt = new Date();

  for (const message of unreadMessages) {
    const delivery = message.deliveryStatus.find(
      (item) => item.userId.toString() === userId.toString(),
    );

    if (!delivery) {
      continue;
    }

    if (!delivery.deliveredAt) {
      delivery.deliveredAt = readAt;
    }

    delivery.readAt = readAt;

    await message.save();
  }

  return {
    messageIds: unreadMessages.map((message) => message._id),
    readAt,
  };
};

const getMessageById = async (messageId) => {
  const message = await Message.findOne({
    _id: messageId,
    deletedAt: null,
  }).populate("senderId", "_id name username avatar");

  return message;
};

const updateMessage = async (messageId, updateData) => {
  const message = await Message.findByIdAndUpdate(messageId, updateData, {
    new: true,
    runValidators: true,
  }).populate("senderId", "_id name username avatar");

  return message;
};

const deleteMessage = async (messageId) => {
  const message = await Message.findByIdAndUpdate(
    messageId,
    {
      deletedAt: new Date(),
    },
    {
      new: true,
    },
  );
  return message;
};

module.exports = {
  getConversationMessages,
  createMessage,
  markMessagesAsRead,
  getMessageById,
  updateMessage,
  deleteMessage,
};
