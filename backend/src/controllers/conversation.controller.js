const conversationService = require("../services/conversation.service");
const ConversationMember = require("../models/ConversationMember");
const User = require("../models/User");
const getConversations = async (req, res, next) =>{
    try{
        const conversations = await conversationService.getConversationsByUserId(req.user.userId);

        return res.status(200).json({
            success:true,
            conversations,
        });
    } catch(error){
        console.error("Get conversations error:", error);
        next(error);
    }
};

const createConversation = async (req, res, next) => {
    try{
        const { type, name, memberIds =[],} = req.body;

        const conversation = await conversationService.createConversation({
            creatorId: req.user.userId,
            type,
            name, 
            memberIds,
        });

        return res.status(201).json({
            success: true,
            message: "Conversation created successfully",
            conversation,
        });
    } catch(error){
        console.error("Create conversation error:", error);
        next(error);
    }
};

const getConversationById = async (req, res, next) => {
  try {
    const conversation =
      await conversationService.getConversationById(
        req.params.id
      );

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    const isMember =
      await ConversationMember.exists({
        conversationId: req.params.id,
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
      conversation,
    });
  } catch (error) {
    console.error("Get conversation error:", error);
    next(error);
  }
};

const updateConversation = async (req, res, next) => {
  try {
    const conversation =
      await conversationService.getConversationById(
        req.params.id
      );

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    const membership = await ConversationMember.findOne({
      conversationId: req.params.id,
      userId: req.user.userId,
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: "You are not a member of this conversation",
      });
    }

    if (membership.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only conversation admins can update it",
      });
    }

    if (conversation.type !== "group") {
      return res.status(400).json({
        success: false,
        message: "Direct conversations cannot be renamed",
      });
    }

    const updateData = {};

    if (req.body.name !== undefined) {
      updateData.name = req.body.name;
    }

    const updatedConversation =
      await conversationService.updateConversation(
        req.params.id,
        updateData
      );

    return res.status(200).json({
      success: true,
      message: "Conversation updated successfully",
      conversation: updatedConversation,
    });
  } catch (error) {
    console.error("Update conversation error:", error);
    next(error);
  }
};

const deleteConversation = async (req, res, next) => {
  try {
    const conversation =
      await conversationService.getConversationById(
        req.params.id
      );

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    const membership = await ConversationMember.findOne({
      conversationId: req.params.id,
      userId: req.user.userId,
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: "You are not a member of this conversation",
      });
    }

    if (membership.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only conversation admins can delete it",
      });
    }

    await conversationService.deleteConversation(
      req.params.id
    );

    return res.status(200).json({
      success: true,
      message: "Conversation deleted successfully",
    });
  } catch (error) {
    console.error("Delete conversation error:", error);
    next(error);
  }
};

const getConversationMembers = async (req, res, next) => {
  try {
    const conversation =
      await conversationService.getConversationById(
        req.params.id
      );

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    const isMember = await ConversationMember.exists({
      conversationId: req.params.id,
      userId: req.user.userId,
    });

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: "You are not a member of this conversation",
      });
    }

    const members =
      await conversationService.getConversationMembers(
        req.params.id
      );

    return res.status(200).json({
      success: true,
      members,
    });
  } catch (error) {
    console.error("Get conversation members error:", error);

    next(error);
  }
};

const addconversationMember = async (req, res, next) =>{
    try{
        const {userId} = req.body;
        const conversation = await conversationService.getConversationById(req.params.id);

        if(!conversation){
            return res.status(404).json({
                success: false,
                message: "Conversation not found",
            });
        }

        const admin = await ConversationMember.findOne({
            conversationId: req.params.id,
            userId: req.user.userId,
            role: "admin",
        });

        if(!admin){
            return res.status(403).json({
                success: false,
                message: "You are not an admin of this conversation",
            });
        }
        const user = await User.findById(userId);
        if(!user){
          return res.status(404).json({
            success: false,
            message: "User not found",
          })
        }
        
        const existingMember = await ConversationMember.findOne({
            conversationId: req.params.id,
            userId,
        });

        if(existingMember){
            return res.status(409).json({
                success: false,
                message: "User is already a member of this conversation",
            });
        }

        const member = await conversationService.addConversationMember(req.params.id, userId);

        return res.status(200).json({
            success: true,
            message: "User added to conversation successfully",
            member,
        });
    } catch(error){
        console.error("Add conversation member error:", error);

        next(error);
    }
}

const removeConversationMember = async (req, res, next) => {
    try{
        const {id, userId} = req.params;
        const conversation = await conversationService.getConversationById(id);

        if(!conversation){
            return res.status(404).json({
                success: false,
                message: "Conversation not found",
            });
        }

        const admin = await ConversationMember.findOne({
            conversationId: id,
            userId: req.user.userId,
            role: "admin",
        });

        if(!admin){
            return res.status(403).json({
                success: false,
                message: "Only conversation admins can remove members",
            });
        }

        if(req.user.userId === userId){
            return res.status(400).json({
                success: false,
                message: "Admins cannot remove themselves from the conversation",
            });
        }

        const member = await conversationService.removeConversationMember(id, userId);
        if(!member){
            return res.status(404).json({
                success: false,
                message: "User is not a member of this conversation",
            });
        }
        return res.status(200).json({
            success: true,
            message: "user removed from conversation successfully",
            member,
        });
    } catch(error){
        console.error("Remove conversation member error:", error);
        next(error);
    }
};

const updateConversationMember = async (req, res, next) => {
  try {
    const { id, userId } = req.params;
    const { role } = req.body;

    const conversation = await conversationService.getConversationById(id);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    const admin = await ConversationMember.findOne({
      conversationId: id,
      userId: req.user.userId,
      role: "admin",
    });

    if (!admin) {
      return res.status(403).json({
        success: false,
        message: "Only conversation admins can update members",
      });
    }

    if (!["admin", "member"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid member role",
      });
    }

    if (req.user.userId === userId) {
      return res.status(400).json({
        success: false,
        message: "You cannot change your own role",
      });
    }

    const member = await conversationService.updateConversationMemberRole(id,userId,{ role });

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Member role updated successfully",
      member,
    });
  } catch (error) {
    console.error("Update conversation member error:",error);

    next(error);
  }
};

const searchConversations = async (req, res, next) => {
  try {
    const { q } = req.query;

    const conversations =
      await conversationService.searchConversations(
        req.user.userId,
        q
      );

    return res.status(200).json({
      success: true,
      conversations,
    });
  } catch (error) {
    console.error("Search conversations error:", error);

    next(error);
  }
};

module.exports = {
    getConversations,
    createConversation,
    getConversationById,
    updateConversation,
    deleteConversation,
    getConversationMembers,
    addconversationMember,
    removeConversationMember,
    updateConversationMember,
    searchConversations,
};
