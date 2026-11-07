import { apiClient } from "../../api/apiClient";

// Conversations

const getConversations = async () => {
  return apiClient.get("/conversations");
};

const createConversation = async (conversationData) => {
  return apiClient.post(
    "/conversations",
    conversationData,
  );
};

const getConversation = async (conversationId) => {
  return apiClient.get(
    `/conversations/${conversationId}`,
  );
};

const updateConversation = async (
  conversationId,
  data,
) => {
  return apiClient.patch(
    `/conversations/${conversationId}`,
    data,
  );
};

const deleteConversation = async (conversationId) => {
  return apiClient.delete(
    `/conversations/${conversationId}`,
  );
};

// Messages

const getMessages = async (conversationId) => {
  return apiClient.get(
    `/conversations/${conversationId}/messages`,
  );
};

const sendMessage = async (
  conversationId,
  content,
) => {
  return apiClient.post(
    `/conversations/${conversationId}/messages`,
    { content },
  );
};

// Members

const getMembers = async (conversationId) => {
  return apiClient.get(
    `/conversations/${conversationId}/members`,
  );
};

const addMember = async (
  conversationId,
  userId,
) => {
  return apiClient.post(
    `/conversations/${conversationId}/members`,
    { userId },
  );
};

const removeMember = async (
  conversationId,
  userId,
) => {
  return apiClient.delete(
    `/conversations/${conversationId}/members/${userId}`,
  );
};

const updateMember = async (
  conversationId,
  userId,
  data,
) => {
  return apiClient.patch(
    `/conversations/${conversationId}/members/${userId}`,
    data,
  );
};

// Individual message operations

const getMessage = async (messageId) => {
  return apiClient.get(`/messages/${messageId}`);
};

const updateMessage = async (
  messageId,
  content,
) => {
  return apiClient.patch(
    `/messages/${messageId}`,
    { content },
  );
};

const deleteMessage = async (messageId) => {
  return apiClient.delete(
    `/messages/${messageId}`,
  );
};

// Search

const searchUsers = async (query) => {
  return apiClient.get(
    `/search/users?q=${encodeURIComponent(query)}`,
  );
};

const searchConversations = async (query) => {
  return apiClient.get(
    `/search/conversations?q=${encodeURIComponent(query)}`,
  );
};

const chatService = {
  getConversations,
  createConversation,
  getConversation,
  updateConversation,
  deleteConversation,

  getMessages,
  sendMessage,

  getMembers,
  addMember,
  removeMember,
  updateMember,

  getMessage,
  updateMessage,
  deleteMessage,

  searchUsers,
  searchConversations,
};

export default chatService;