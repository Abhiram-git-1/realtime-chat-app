const Message = require("../models/Message");
const Conversation = require("../models/Conversation");
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
  const message = await Message.findOne({
    _id: messageId,
    deletedAt: null,
  })
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