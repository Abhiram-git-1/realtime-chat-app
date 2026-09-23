const messageService = require("../services/message.service");
const conversationService = require("../services/conversation.service");

const ConversationMember = require("../models/ConversationMember");
const Conversation = require("../models/Conversation");

const getConversationMessages = async (req, res, next) => {
  try {
    const { id } = req.params;

    const conversation = await conversationService.getConversationById(id);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    const isMember = await ConversationMember.exists({
      conversationId: id,
      userId: req.user.userId,
    });

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: "You are not a member of this conversation",
      });
    }

    const messages =
      await messageService.getConversationMessages(id);

    return res.status(200).json({
      success: true,
      messages,
    });
  } catch (error) {
    console.error("Get conversation messages error:", error);

    next(error);
  }
};

const createMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    const conversation = await Conversation.findOne({
      _id: id,
      deletedAt: null,
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    const isMember = await ConversationMember.exists({
      conversationId: id,
      userId: req.user.userId,
    });

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: "You are not a member of this conversation",
      });
    }

    const message = await messageService.createMessage({
      conversationId: id,
      senderId: req.user.userId,
      content,
    });

    return res.status(201).json({
      success: true,
      message,
    });
  } catch (error) {
    console.error("Create message error:", error);

    next(error);
  }
};

const getMessageById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const message = await messageService.getMessageById(id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    const conversation = await Conversation.findOne({ // Check if the conversation exists and is not deleted
      _id: message.conversationId,
      deletedAt: null,
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    const isMember = await ConversationMember.exists({
      conversationId: message.conversationId,
      userId: req.user.userId,
    });

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: "You are not a member of this conversation",
      });
    }

    return res.status(200).json({
      success: true,
      message,
    });
  } catch (error) {
    console.error("Get message error:", error);

    next(error);
  }
};

const MESSAGE_EDIT_LIMIT = 15 * 60 * 1000; // 15 minutes

const updateMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    const message = await messageService.getMessageById(id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    // check whether the conversation is active or not 
    const conversation = await Conversation.findOne({
        _id: message.conversationId,
        deletedAt: null,
    });

    if(!conversation){
        return res.status(404).json({
            success: false,
            message: "Conversation not found",
        });
    }
    
    const isMember = await ConversationMember.exists({
      conversationId: message.conversationId,
      userId: req.user.userId,
    });

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: "You are not a member of this conversation",
      });
    }

    // Only sender can edit
    if (message.senderId._id.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: "You can only edit your own messages",
      });
    }

    // Message can only be edited within 15 minutes
    const messageAge = Date.now() - message.createdAt.getTime();

    if (messageAge > MESSAGE_EDIT_LIMIT) {
      return res.status(400).json({
        success: false,
        message: "Message can no longer be edited",
      });
    }

    const updatedMessage = await messageService.updateMessage(
      id,
      { content }
    );

    return res.status(200).json({
      success: true,
      message: updatedMessage,
    });
  } catch (error) {
    console.error("Update message error:", error);

    next(error);
  }
};

const deleteMessage = async (req, res, next) => {
  try {
    const { id } = req.params;

    const message = await messageService.getMessageById(id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    const conversation = await conversationService.getConversationById(message.conversationId);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    const isMember = await ConversationMember.exists({
      conversationId: message.conversationId,
      userId: req.user.userId,
    });

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: "You are not a member of this conversation",
      });
    }

    // Only sender can delete
    if (message.senderId._id.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own messages",
      });
    }

    const deletedMessage =
      await messageService.deleteMessage(id);

    return res.status(200).json({
      success: true,
      message: deletedMessage,
    });
  } catch (error) {
    console.error("Delete message error:", error);

    next(error);
  }
};

module.exports = {
  getConversationMessages,
  createMessage,
  getMessageById,
  updateMessage,
  deleteMessage,
};
