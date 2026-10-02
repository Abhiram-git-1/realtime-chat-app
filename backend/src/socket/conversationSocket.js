const User = require("../models/User");
const Conversation = require("../models/Conversation");
const ConversationMember = require("../models/ConversationMember");
const Message = require("../models/Message");
const messageService = require("../services/message.service");
const presence = require("./presence");

const registerConversationSocket = (io, socket) => {
  // Join a conversation room
  socket.on("join_conversation", async (conversationId) => {
    try {
      const conversation = await Conversation.findOne({
        _id: conversationId,
        deletedAt: null,
      });

      if (!conversation) {
        return socket.emit("socket_error", {
          message: "Conversation not found",
        });
      }

      const isMember = await ConversationMember.exists({
        conversationId,
        userId: socket.user.userId,
      });

      if (!isMember) {
        return socket.emit("socket_error", {
          message: "You are not a member of this conversation",
        });
      }

      // Join Socket.IO room
      socket.join(conversationId);

      console.log(
        `User ${socket.user.userId} joined conversation ${conversationId}`,
      );

      // Get all members of this conversation
      const members = await ConversationMember.find({
        conversationId,
      }).select("userId");

      // Get currently online members
      const onlineMemberIds = members
        .filter(
          (member) =>
            member.userId.toString() !== socket.user.userId &&
            presence.isUserOnline(member.userId.toString()),
        )
        .map((member) => member.userId);

      // Get user information
      const onlineMembers = await User.find({
        _id: { $in: onlineMemberIds },
      }).select("_id name username avatar");

      // Send current presence to the newly joined user
      socket.emit("conversation_presence", {
        conversationId,
        users: onlineMembers,
      });

      // Tell other members that this user is online
      const currentUser = await User.findById(socket.user.userId).select(
        "_id name username avatar",
      );

      const roomSockets = io.sockets.adapter.rooms.get(conversationId);

      if (roomSockets) {
        for (const socketId of roomSockets) {
          const targetSocket = io.sockets.sockets.get(socketId);

          if (!targetSocket) {
            continue;
          }

          // Don't send presence to another socket
          // belonging to the same user
          if (targetSocket.user.userId === socket.user.userId) {
            continue;
          }

          targetSocket.emit("user_online", {
            conversationId,
            user: currentUser,
          });
        }
      }
    } catch (error) {
      console.error("Join conversation error:", error);

      socket.emit("socket_error", {
        message: "Failed to join conversation",
      });
    }
  });

  // Send a realtime message
  socket.on("send_message", async ({ conversationId, content }) => {
    try {
      // 1. Validate basic input
      if (!conversationId || !content?.trim()) {
        return socket.emit("socket_error", {
          message: "Conversation ID and message content are required",
        });
      }

      // 2. Check conversation exists and is active
      const conversation = await Conversation.findOne({
        _id: conversationId,
        deletedAt: null,
      });

      if (!conversation) {
        return socket.emit("socket_error", {
          message: "Conversation not found",
        });
      }

      // 3. Check whether sender belongs to conversation
      const isMember = await ConversationMember.exists({
        conversationId,
        userId: socket.user.userId,
      });

      if (!isMember) {
        return socket.emit("socket_error", {
          message: "You are not a member of this conversation",
        });
      }

      // 4. Persist message in MongoDB
      const message = await messageService.createMessage({
        conversationId,
        senderId: socket.user.userId,
        content: content.trim(),
      });

      // 5. Get complete message with sender information
      const populatedMessage = await messageService.getMessageById(message._id);

      // send mesg to sender
      socket.emit("message_sent", {
        message: populatedMessage,
      });
      // send mesg to all other members
      socket.to(conversationId).emit("new_message", {
        message: populatedMessage,
      });
    } catch (error) {
      console.error("Send message error:", error);

      socket.emit("socket_error", {
        message: "Failed to send message",
      });
    }
  });

  // User started typing
  socket.on("typing_start", async (conversationId) => {
    try {
      const isMember = await ConversationMember.exists({
        conversationId,
        userId: socket.user.userId,
      });

      if (!isMember) {
        return socket.emit("socket_error", {
          message: "You are not a member of this conversation",
        });
      }

      socket.to(conversationId).emit("user_typing", {
        userId: socket.user.userId,
        conversationId,
      });
    } catch (error) {
      console.error("Typing start error:", error);

      socket.emit("socket_error", {
        message: "Failed to send typing status",
      });
    }
  });

  // User stopped typing
  socket.on("typing_stop", async (conversationId) => {
    try {
      const isMember = await ConversationMember.exists({
        conversationId,
        userId: socket.user.userId,
      });

      if (!isMember) {
        return socket.emit("socket_error", {
          message: "You are not a member of this conversation",
        });
      }

      socket.to(conversationId).emit("user_stopped_typing", {
        userId: socket.user.userId,
        conversationId,
      });
    } catch (error) {
      console.error("Typing stop error:", error);

      socket.emit("socket_error", {
        message: "Failed to send typing status",
      });
    }
  });

  socket.on("message_delivered", async ({ messageId }) => {
    try {
      if (!messageId) {
        return socket.emit("socket_error", {
          message: "Message ID is required",
        });
      }

      const message = await Message.findOne({
        _id: messageId,
        deletedAt: null,
      });

      if (!message) {
        return socket.emit("socket_error", {
          message: "Message not found",
        });
      }

      // Only a recipient can ack delivery
      const delivery = message.deliveryStatus.find(
        (item) => item.userId.toString() === socket.user.userId,
      );

      if (!delivery) {
        return socket.emit("socket_error", {
          message: "You are not a recipient of this message",
        });
      }

      // Prevent updating an already delivered message
      if (!delivery.deliveredAt) {
        delivery.deliveredAt = new Date();

        await message.save();
      }

      // Tell the sender that this recipient received it
      io.to(message.conversationId.toString()).emit(
        "message_delivery_updated",
        {
          messageId: message._id,
          userId: socket.user.userId,
          deliveredAt: delivery.deliveredAt,
        },
      );
    } catch (error) {
      console.error("Message delivery error:", error);

      socket.emit("socket_error", {
        message: "Failed to update message delivery",
      });
    }
  });

  socket.on("mark_messages_read", async (conversationId) => {
    try {
      console.log(
        "mark_messages_read received:",
        conversationId,
        "user:",
        socket.user.userId,
      );
      if (!conversationId) {
        return socket.emit("socket_error", {
          message: "Conversation ID is required",
        });
      }

      const conversation = await Conversation.findOne({
        _id: conversationId,
        deletedAt: null,
      });

      if (!conversation) {
        return socket.emit("socket_error", {
          message: "Conversation not found",
        });
      }

      const isMember = await ConversationMember.exists({
        conversationId,
        userId: socket.user.userId,
      });

      if (!isMember) {
        return socket.emit("socket_error", {
          message: "You are not a member of this conversation",
        });
      }

      const result = await messageService.markMessagesAsRead({
        conversationId,
        userId: socket.user.userId,
      });

      if (result.messageIds.length === 0) {
        return;
      }

      io.to(conversationId).emit("messages_read", {
        conversationId,
        userId: socket.user.userId,
        messageIds: result.messageIds,
        readAt: result.readAt,
      });
    } catch (error) {
      console.error("Mark messages as read error:", error);

      socket.emit("socket_error", {
        message: "Failed to mark messages as read",
      });
    }
  });
};

module.exports = registerConversationSocket;
