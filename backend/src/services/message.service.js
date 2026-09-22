const Message = require("../models/Message");
const Conversation = require("../models/Conversation");
const getConversationMessages = async(conversationId)=>{
    const messages = await Message.find({
        conversationId,
    }).sort({createdAt: -1}).populate("senderId", "_id name username avatar");

    return messages;
};

const createMessage = async({conversationId, senderId, content})=>{
    const message = await Message.create({
        conversationId,
        senderId,
        content,
    });

    await Conversation.findByIdAndUpdate(conversationId, {
        lastMessage: message._id,
        lastMessageAt: message.createdAt,
    });

    return message;
}

const getMessageById = async (messageId) => {
  const message = await Message.findById(messageId)
    .populate("senderId", "_id name username avatar");

  return message;
};

const updateMessage = async (messageId, updateData) => {
  const message = await Message.findByIdAndUpdate(
    messageId,
    updateData,
    {
      new: true,
      runValidators: true,
    }
  ).populate("senderId", "_id name username avatar");

  return message;
};

const deleteMessage = async (messageId) => {
    const message = await Message.findByIdAndUpdate(
        messageId,
        {
            deletedAt: new Date(),
        },
        {
            new : true,
        }
    );
    return message;
};

module.exports = {
    getConversationMessages,
    createMessage,
    getMessageById,
    updateMessage,
    deleteMessage,
};