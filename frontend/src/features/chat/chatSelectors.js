export const selectConversations = (state) =>
  state.chat.conversations;

export const selectActiveConversation = (state) =>
  state.chat.activeConversation;

export const selectMessages = (state) =>
  state.chat.messages;

export const selectMembers = (state) =>
  state.chat.members;

export const selectSearchUsers = (state) =>
  state.chat.searchUsers;

export const selectSearchConversations = (state) =>
  state.chat.searchConversations;

export const selectChatLoading = (state) =>
  state.chat.loading;

export const selectMessagesLoading = (state) =>
  state.chat.messagesLoading;

export const selectMembersLoading = (state) =>
  state.chat.membersLoading;

export const selectSearchLoading = (state) =>
  state.chat.searchLoading;

export const selectChatError = (state) =>
  state.chat.error;