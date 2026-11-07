import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import chatService from "./chatService";

const initialState = {
  conversations: [],
  activeConversation: null,
  messages: [],
  members: [],
  onlineUsers: [],
  pendingDeliveries: {},

  searchUsers: [],
  searchConversations: [],

  loading: false,
  messagesLoading: false,
  membersLoading: false,
  searchLoading: false,

  error: null,
};

export const fetchConversations = createAsyncThunk(
  "chat/fetchConversations",
  async (_, { rejectWithValue }) => {
    try {
      return await chatService.getConversations();
    } catch (error) {
      return rejectWithValue(
        error.data || {
          message: error.message,
        },
      );
    }
  },
);

export const fetchConversation = createAsyncThunk(
  "chat/fetchConversation",
  async (conversationId, { rejectWithValue }) => {
    try {
      return await chatService.getConversation(conversationId);
    } catch (error) {
      return rejectWithValue(
        error.data || {
          message: error.message,
        },
      );
    }
  },
);

export const createConversation = createAsyncThunk(
  "chat/createConversation",
  async (conversationData, { rejectWithValue }) => {
    try {
      return await chatService.createConversation(conversationData);
    } catch (error) {
      return rejectWithValue(
        error.data || {
          message: error.message,
        },
      );
    }
  },
);

export const fetchMessages = createAsyncThunk(
  "chat/fetchMessages",
  async (conversationId, { rejectWithValue }) => {
    try {
      return await chatService.getMessages(conversationId);
    } catch (error) {
      return rejectWithValue(
        error.data || {
          message: error.message,
        },
      );
    }
  },
);

export const fetchMembers = createAsyncThunk(
  "chat/fetchMembers",
  async (conversationId, { rejectWithValue }) => {
    try {
      return await chatService.getMembers(conversationId);
    } catch (error) {
      return rejectWithValue(
        error.data || {
          message: error.message,
        },
      );
    }
  },
);

export const addMember = createAsyncThunk(
  "chat/addMember",
  async ({ conversationId, userId }, { rejectWithValue }) => {
    try {
      return await chatService.addMember(conversationId, userId);
    } catch (error) {
      return rejectWithValue(
        error.data || {
          message: error.message,
        },
      );
    }
  },
);
export const updateMember = createAsyncThunk(
  "chat/updateMember",
  async ({ conversationId, userId, data }, { rejectWithValue }) => {
    try {
      return await chatService.updateMember(conversationId, userId, data);
    } catch (error) {
      return rejectWithValue(error.data || { message: error.message });
    }
  },
);

export const removeMember = createAsyncThunk(
  "chat/removeMember",
  async ({ conversationId, userId }, { rejectWithValue }) => {
    try {
      return await chatService.removeMember(conversationId, userId);
    } catch (error) {
      return rejectWithValue(
        error.data || {
          message: error.message,
        },
      );
    }
  },
);

export const sendMessage = createAsyncThunk(
  "chat/sendMessage",
  async ({ conversationId, content }, { rejectWithValue }) => {
    try {
      return await chatService.sendMessage(conversationId, content);
    } catch (error) {
      return rejectWithValue(
        error.data || {
          message: error.message,
        },
      );
    }
  },
);

export const updateMessage = createAsyncThunk(
  "chat/updateMessage",
  async ({ messageId, content }, { rejectWithValue }) => {
    try {
      return await chatService.updateMessage(messageId, content);
    } catch (error) {
      return rejectWithValue(error.data || { message: error.message });
    }
  },
);

export const deleteMessage = createAsyncThunk(
  "chat/deleteMessage",
  async (messageId, { rejectWithValue }) => {
    try {
      return await chatService.deleteMessage(messageId);
    } catch (error) {
      return rejectWithValue(error.data || { message: error.message });
    }
  },
);

export const updateConversation = createAsyncThunk(
  "chat/updateConversation",
  async ({ conversationId, data }, { rejectWithValue }) => {
    try {
      return await chatService.updateConversation(conversationId, data);
    } catch (error) {
      return rejectWithValue(
        error.data || {
          message: error.message,
        },
      );
    }
  },
);

export const deleteConversation = createAsyncThunk(
  "chat/deleteConversation",
  async (conversationId, { rejectWithValue }) => {
    try {
      return await chatService.deleteConversation(conversationId);
    } catch (error) {
      return rejectWithValue(
        error.data || {
          message: error.message,
        },
      );
    }
  },
);

export const searchUsers = createAsyncThunk(
  "chat/searchUsers",
  async (query, { rejectWithValue }) => {
    try {
      return await chatService.searchUsers(query);
    } catch (error) {
      return rejectWithValue(
        error.data || {
          message: error.message,
        },
      );
    }
  },
);

export const searchConversations = createAsyncThunk(
  "chat/searchConversations",
  async (query, { rejectWithValue }) => {
    try {
      return await chatService.searchConversations(query);
    } catch (error) {
      return rejectWithValue(
        error.data || {
          message: error.message,
        },
      );
    }
  },
);

const chatSlice = createSlice({
  name: "chat",

  initialState,

  reducers: {
    setActiveConversation: (state, action) => {
      state.activeConversation = action.payload;
      state.messages = [];
      state.members = [];
      state.onlineUsers = [];
      state.pendingDeliveries = {};
      state.error = null;
    },

    clearActiveConversation: (state) => {
      state.activeConversation = null;
      state.messages = [];
      state.members = [];
      state.onlineUsers = [];
      state.pendingDeliveries = {};
    },

    clearChatError: (state) => {
      state.error = null;
    },

    clearSearchResults: (state) => {
      state.searchUsers = [];
      state.searchConversations = [];
    },

    clearMessages: (state) => {
      state.messages = [];
    },

    addRealtimeMessage: (state, action) => {
      const message = action.payload;

      if (!message?._id) {
        return;
      }

      const alreadyExists = state.messages.some(
        (item) => String(item._id) === String(message._id),
      );

      if (alreadyExists) {
        return;
      }

      const pendingDelivery = state.pendingDeliveries[String(message._id)];

      if (pendingDelivery) {
        if (!message.deliveryStatus) {
          message.deliveryStatus = [];
        }

        const existingDelivery = message.deliveryStatus.find(
          (item) =>
            String(item.userId?._id || item.userId) ===
            String(pendingDelivery.userId),
        );

        if (existingDelivery) {
          existingDelivery.deliveredAt = pendingDelivery.deliveredAt;
        } else {
          message.deliveryStatus.push({
            userId: pendingDelivery.userId,
            deliveredAt: pendingDelivery.deliveredAt,
            readAt: null,
          });
        }

        delete state.pendingDeliveries[String(message._id)];
      }

      state.messages.push(message);
    },

    updateMessageDelivery: (state, action) => {
      const { messageId, userId, deliveredAt } = action.payload;

      const message = state.messages.find(
        (item) => String(item._id) === String(messageId),
      );

      /*
       * The delivery event can arrive before
       * message_sent reaches Redux.
       *
       * Store it temporarily so addRealtimeMessage
       * can apply it when the message arrives.
       */
      if (!message) {
        state.pendingDeliveries[String(messageId)] = {
          userId,
          deliveredAt,
        };

        return;
      }

      if (!message.deliveryStatus) {
        message.deliveryStatus = [];
      }

      const delivery = message.deliveryStatus.find(
        (item) => String(item.userId?._id || item.userId) === String(userId),
      );

      if (delivery) {
        delivery.deliveredAt = deliveredAt;
      } else {
        message.deliveryStatus.push({
          userId,
          deliveredAt,
          readAt: null,
        });
      }
    },

    updateMessageRead: (state, action) => {
      const { messageIds, userId, readAt } = action.payload;

      if (!Array.isArray(messageIds)) return;

      messageIds.forEach((messageId) => {
        const message = state.messages.find(
          (item) => String(item._id) === String(messageId),
        );

        if (!message) return;

        if (!message.deliveryStatus) {
          message.deliveryStatus = [];
        }

        const delivery = message.deliveryStatus.find(
          (item) => String(item.userId?._id || item.userId) === String(userId),
        );

        if (delivery) {
          delivery.deliveredAt = delivery.deliveredAt || readAt;
          delivery.readAt = readAt;
        } else {
          message.deliveryStatus.push({
            userId,
            deliveredAt: readAt,
            readAt,
          });
        }
      });
    },

    setConversationOnlineUsers: (state, action) => {
      state.onlineUsers = action.payload || [];
    },

    addOnlineUser: (state, action) => {
      const user = action.payload;

      if (!user?._id) {
        return;
      }

      const alreadyOnline = state.onlineUsers.some(
        (item) => String(item._id) === String(user._id),
      );

      if (!alreadyOnline) {
        state.onlineUsers.push(user);
      }
    },

    removeOnlineUser: (state, action) => {
      const userId = action.payload;

      state.onlineUsers = state.onlineUsers.filter(
        (user) => String(user._id) !== String(userId),
      );
    },

    clearOnlineUsers: (state) => {
      state.onlineUsers = [];
    },
  },

  extraReducers: (builder) => {
    builder

      // Conversations

      .addCase(fetchConversations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.loading = false;
        state.conversations =
          action.payload?.conversations || action.payload || [];
      })

      .addCase(fetchConversations.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload?.message || "Failed to load conversations.";
      })

      .addCase(fetchConversation.fulfilled, (state, action) => {
        state.activeConversation =
          action.payload?.conversation || action.payload;
      })

      .addCase(fetchConversation.rejected, (state, action) => {
        state.error = action.payload?.message || "Failed to load conversation.";
      })

      .addCase(createConversation.fulfilled, (state, action) => {
        const conversation = action.payload?.conversation || action.payload;

        if (!conversation?._id) {
          return;
        }

        const existingIndex = state.conversations.findIndex(
          (item) => item._id === conversation._id,
        );

        if (existingIndex !== -1) {
          state.conversations[existingIndex] = conversation;
        } else {
          state.conversations.unshift(conversation);
        }

        state.activeConversation = conversation;
      })
      .addCase(createConversation.rejected, (state, action) => {
        state.error =
          action.payload?.message || "Failed to create conversation.";
      })

      // Messages

      .addCase(fetchMessages.pending, (state) => {
        state.messagesLoading = true;
        state.error = null;
      })

      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.messagesLoading = false;
        state.messages = action.payload?.messages || action.payload || [];
      })

      .addCase(fetchMessages.rejected, (state, action) => {
        state.messagesLoading = false;
        state.error = action.payload?.message || "Failed to load messages.";
      })

      .addCase(sendMessage.fulfilled, (state, action) => {
        const message = action.payload?.message || action.payload;

        if (message) {
          state.messages.push(message);
        }
      })

      .addCase(sendMessage.rejected, (state, action) => {
        state.error = action.payload?.message || "Failed to send message.";
      })

      .addCase(updateMessage.fulfilled, (state, action) => {
        const updatedMessage = action.payload?.message || action.payload;

        if (!updatedMessage?._id) {
          return;
        }

        const index = state.messages.findIndex(
          (message) => message._id === updatedMessage._id,
        );

        if (index !== -1) {
          state.messages[index] = updatedMessage;
        }
      })

      .addCase(deleteMessage.fulfilled, (state, action) => {
        const deletedMessage = action.payload?.message || action.payload;

        const messageId = deletedMessage?._id || action.meta.arg;

        const message = state.messages.find((item) => item._id === messageId);

        if (message) {
          message.content = null;
          message.deletedAt =
            deletedMessage?.deletedAt || new Date().toISOString();
        }
      })

      // Members

      .addCase(fetchMembers.pending, (state) => {
        state.membersLoading = true;
      })

      .addCase(fetchMembers.fulfilled, (state, action) => {
        state.membersLoading = false;
        state.members = action.payload?.members || action.payload || [];
      })

      .addCase(fetchMembers.rejected, (state, action) => {
        state.membersLoading = false;
        state.error = action.payload?.message || "Failed to load members.";
      })
      // add memebers to conversation
      .addCase(addMember.fulfilled, (state) => {
        /*
         * The backend has changed the membership.
         * The UI will explicitly refetch members after
         * a successful add, so we don't guess the response shape.
         */
        state.error = null;
      })

      .addCase(addMember.rejected, (state, action) => {
        state.error = action.payload?.message || "Failed to add member.";
      })

      // Member update
      .addCase(updateMember.fulfilled, (state) => {
        state.error = null;
      })
      .addCase(updateMember.rejected, (state, action) => {
        state.error =
          action.payload?.message || "Failed to update member role.";
      })

      // Member removal
      .addCase(removeMember.fulfilled, (state) => {
        state.error = null;
      })

      .addCase(removeMember.rejected, (state, action) => {
        state.error = action.payload?.message || "Failed to remove member.";
      })

      // Conversation update/delete

      .addCase(updateConversation.fulfilled, (state, action) => {
        const updatedConversation =
          action.payload?.conversation || action.payload;

        if (!updatedConversation?._id) {
          return;
        }

        const index = state.conversations.findIndex(
          (conversation) => conversation._id === updatedConversation._id,
        );

        if (index !== -1) {
          state.conversations[index] = updatedConversation;
        }

        if (state.activeConversation?._id === updatedConversation._id) {
          state.activeConversation = updatedConversation;
        }
      })

      .addCase(deleteConversation.fulfilled, (state, action) => {
        const conversationId = action.meta.arg;

        state.conversations = state.conversations.filter(
          (conversation) => conversation._id !== conversationId,
        );

        if (state.activeConversation?._id === conversationId) {
          state.activeConversation = null;
          state.messages = [];
          state.members = [];
        }
      })

      // Search

      .addCase(searchUsers.pending, (state) => {
        state.searchLoading = true;
      })

      .addCase(searchUsers.fulfilled, (state, action) => {
        state.searchLoading = false;
        state.searchUsers = action.payload?.users || action.payload || [];
      })

      .addCase(searchUsers.rejected, (state, action) => {
        state.searchLoading = false;
        state.error = action.payload?.message || "User search failed.";
      })

      .addCase(searchConversations.fulfilled, (state, action) => {
        state.searchConversations =
          action.payload?.conversations || action.payload || [];
      })

      .addCase(searchConversations.rejected, (state, action) => {
        state.error = action.payload?.message || "Conversation search failed.";
      });
  },
});

export const {
  setActiveConversation,
  clearActiveConversation,
  clearChatError,
  clearSearchResults,
  clearMessages,
  addRealtimeMessage,
  setConversationOnlineUsers,
  addOnlineUser,
  removeOnlineUser,
  clearOnlineUsers,
  updateMessageDelivery,
  updateMessageRead,
} = chatSlice.actions;

export default chatSlice.reducer;
