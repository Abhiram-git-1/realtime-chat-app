import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  addOnlineUser,
  addRealtimeMessage,
  removeOnlineUser,
  setActiveConversation,
  setConversationOnlineUsers,
  updateMessageDelivery,
  updateMessageRead,
} from "../../features/chat/chatSlice";
import MessageBubble from "./MessageBubble";
import ConversationDetailsModal from "./ConversationDetailsModal";

import socketService from "../../features/chat/socketService";

function MessagePanel({ onBack }) {
  const dispatch = useDispatch();

  const { activeConversation, messages, messagesLoading, onlineUsers } =
    useSelector((state) => state.chat);

  const user = useSelector((state) => state.auth.user);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [localError, setLocalError] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  const [typingUserId, setTypingUserId] = useState(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (!activeConversation?._id) {
      dispatch(setConversationOnlineUsers([]));
      return;
    }

    const socket = socketService.getSocket();

    if (!socket) {
      return;
    }

    const handleConversationPresence = (data) => {
      if (String(data?.conversationId) !== String(activeConversation._id)) {
        return;
      }

      console.log("📡 Conversation presence:", data);

      dispatch(setConversationOnlineUsers(data.users || []));
    };

    const handleUserOnline = (data) => {
      if (String(data?.conversationId) !== String(activeConversation._id)) {
        return;
      }

      console.log("🟢 User online:", data);

      dispatch(addOnlineUser(data.user));
    };

    const handleUserOffline = (data) => {
      if (String(data?.conversationId) !== String(activeConversation._id)) {
        return;
      }

      console.log("🔴 User offline:", data);

      dispatch(removeOnlineUser(data.userId));
    };

    const handleSocketConnect = () => {
      console.log("🔄 Socket connected. Rejoining conversation.");

      socketService.joinConversation(activeConversation._id);

      socket.emit("mark_messages_read", activeConversation._id);
    };

    socket.on("conversation_presence", handleConversationPresence);
    socket.on("user_online", handleUserOnline);
    socket.on("user_offline", handleUserOffline);
    socket.on("connect", handleSocketConnect);

    socketService.joinConversation(activeConversation._id);

    if (socket.connected) {
      socket.emit("mark_messages_read", activeConversation._id);
    }

    return () => {
      socket.off("conversation_presence", handleConversationPresence);
      socket.off("user_online", handleUserOnline);
      socket.off("user_offline", handleUserOffline);
      socket.off("connect", handleSocketConnect);

      dispatch(setConversationOnlineUsers([]));
    };
  }, [dispatch, activeConversation?._id]);

  useEffect(() => {
    const socket = socketService.getSocket();

    if (!socket) {
      return;
    }

    const handleNewMessage = (data) => {
      const message = data?.message;

      if (!message) {
        return;
      }

      console.log("📨 New realtime message:", message);

      if (String(message.conversationId) !== String(activeConversation?._id)) {
        return;
      }

      dispatch(addRealtimeMessage(message));

      const socket = socketService.getSocket();

      if (socket?.connected && message._id) {
        socket.emit("message_delivered", {
          messageId: message._id,
        });
      }
    };

    const handleMessageSent = (data) => {
      const message = data?.message;

      if (!message) {
        return;
      }

      console.log("📤 Message sent:", message);

      if (String(message.conversationId) === String(activeConversation?._id)) {
        dispatch(addRealtimeMessage(message));
      }

      setSending(false);
    };

    const handleUserTyping = (data) => {
      if (String(data?.conversationId) !== String(activeConversation?._id)) {
        return;
      }

      if (String(data?.userId) === String(user?.id)) {
        return;
      }

      console.log("⌨️ User typing:", data);

      setTypingUserId(data.userId);
    };

    const handleUserStoppedTyping = (data) => {
      if (String(data?.conversationId) !== String(activeConversation?._id)) {
        return;
      }

      console.log("🛑 User stopped typing:", data);

      setTypingUserId(null);
    };

    const handleMessageDeliveryUpdated = (data) => {
      if (!data?.messageId || !data?.userId) {
        return;
      }

      console.log("✓✓ Message delivered:", data);

      dispatch(
        updateMessageDelivery({
          messageId: data.messageId,
          userId: data.userId,
          deliveredAt: data.deliveredAt,
        }),
      );
    };

    const handleMessagesRead = ({
      conversationId,
      userId,
      messageIds,
      readAt,
    }) => {
      if (String(conversationId) !== String(activeConversation?._id)) {
        return;
      }

      dispatch(
        updateMessageRead({
          messageIds,
          userId,
          readAt,
        }),
      );
    };

    const handleSocketError = (data) => {
      console.error("🔴 Socket error:", data.message);

      setLocalError(data.message || "Socket error.");
      setSending(false);
    };

    socket.on("new_message", handleNewMessage);
    socket.on("message_sent", handleMessageSent);
    socket.on("user_typing", handleUserTyping);
    socket.on("user_stopped_typing", handleUserStoppedTyping);
    socket.on("message_delivery_updated", handleMessageDeliveryUpdated);
    socket.on("messages_read", handleMessagesRead);
    socket.on("socket_error", handleSocketError);

    return () => {
      socket.off("new_message", handleNewMessage);
      socket.off("message_sent", handleMessageSent);
      socket.off("user_typing", handleUserTyping);
      socket.off("user_stopped_typing", handleUserStoppedTyping);
      socket.off("message_delivery_updated", handleMessageDeliveryUpdated);
      socket.off("messages_read", handleMessagesRead);
      socket.off("socket_error", handleSocketError);
    };
  }, [dispatch, activeConversation?._id, user?.id]);

  useEffect(() => {
    const socket = socketService.getSocket();

    return () => {
      if (socket?.connected && activeConversation?._id) {
        socket.emit("typing_stop", activeConversation._id);
      }
    };
  }, [activeConversation?._id]);

  if (!activeConversation) {
    return (
      <section className="hidden flex-1 items-center justify-center bg-[#211B18] md:flex">
        <div className="max-w-sm px-6 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-[#3A302B] bg-[#171311]/70 text-3xl shadow-xl">
            ◈
          </div>

          <h2 className="mt-6 text-xl font-semibold text-[#F5EEE8]">
            Your conversations
          </h2>

          <p className="mt-2 text-sm leading-6 text-[#A89B91]">
            Select a conversation from the sidebar to view your messages.
          </p>
        </div>
      </section>
    );
  }

  const handleTyping = () => {
    const socket = socketService.getSocket();

    if (!socket?.connected || !activeConversation?._id) {
      return;
    }

    socket.emit("typing_start", activeConversation._id);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("typing_stop", activeConversation._id);
      typingTimeoutRef.current = null;
    }, 1000);
  };

  const handleSendMessage = () => {
    const trimmedMessage = content.trim();

    if (!trimmedMessage || !activeConversation?._id) {
      return;
    }

    const socket = socketService.getSocket();

    if (!socket?.connected) {
      setLocalError("Socket is not connected.");
      return;
    }

    setLocalError("");
    setSending(true);

    socket.emit("send_message", {
      conversationId: activeConversation._id,
      content: trimmedMessage,
    });

    setContent("");
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const activeMembers = activeConversation?.members || [];

  const otherMember =
    activeConversation?.type === "direct"
      ? activeMembers.find(
          (member) => String(member.userId?._id) !== String(user?.id),
        )
      : null;

  const isOtherUserOnline =
    activeConversation?.type === "direct" &&
    onlineUsers.some(
      (onlineUser) =>
        String(onlineUser._id) === String(otherMember?.userId?._id),
    );

  const conversationTitle =
    activeConversation?.type === "direct"
      ? otherMember?.userId?.name ||
        otherMember?.userId?.username ||
        "Unknown user"
      : activeConversation?.name || "Group conversation";

  const conversationAvatar =
    activeConversation?.type === "direct" ? otherMember?.userId?.avatar : null;

  return (
    <section className="flex min-w-0 flex-1 flex-col bg-[#211B18]">
      {/* Header */}
      <header className="flex items-center gap-3 border-b border-[#3A302B]/70 bg-[#211B18]/80 px-5 py-4 backdrop-blur-xl">
        <button
          type="button"
          onClick={onBack}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#3A302B] text-[#A89B91] transition hover:border-[#C65D3B]/50 hover:text-[#F5EEE8] md:hidden"
          aria-label="Back to conversations"
        >
          ←
        </button>
        {/* Avatar */}
        {conversationAvatar ? (
          <img
            src={conversationAvatar}
            alt={conversationTitle}
            className="h-11 w-11 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#2C2521] text-sm font-semibold text-[#C65D3B]">
            {conversationTitle?.charAt(0)?.toUpperCase() || "?"}
          </div>
        )}

        {/* Conversation information */}
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-semibold text-[#F5EEE8]">
            {conversationTitle}
          </h2>

          <p
            className={
              activeConversation.type === "direct"
                ? isOtherUserOnline
                  ? "text-xs text-[#78C091]"
                  : "text-xs text-[#A89B91]"
                : "text-xs text-[#A89B91]"
            }
          >
            {activeConversation.type === "direct"
              ? isOtherUserOnline
                ? "Online"
                : "Offline"
              : `${activeMembers.length} members`}
          </p>
        </div>

        {/* Details button */}
        <button
          type="button"
          onClick={() => setShowDetails(true)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#3A302B] bg-[#171311]/70 text-[#A89B91] transition hover:border-[#C65D3B]/50 hover:bg-[#633326]/20 hover:text-[#F5EEE8]"
          title="Conversation details"
        >
          ⋮
        </button>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-6">
        {messagesLoading ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#3A302B] border-t-[#C65D3B]" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <p className="text-sm text-[#F5EEE8]">No messages yet.</p>

              <p className="mt-1 text-xs text-[#A89B91]">
                Send the first message.
              </p>
            </div>
          </div>
        ) : (
          <div className="mx-auto flex max-w-4xl flex-col gap-3">
            {messages.map((message) => (
              <MessageBubble
                key={message._id}
                message={message}
                isOwn={
                  String(message.senderId?._id) === String(user?.id) ||
                  String(message.senderId) === String(user?.id)
                }
              />
            ))}
          </div>
        )}
      </div>

      {typingUserId && (
        <div className="px-5 pb-2">
          <p className="mx-auto max-w-4xl text-xs text-[#A89B91]">
            Someone is typing...
          </p>
        </div>
      )}

      {/* Message composer */}
      <div className="border-t border-[#3A302B]/70 bg-[#171311]/50 p-4">
        {localError && (
          <p className="mx-auto mb-2 max-w-4xl px-2 text-xs text-[#D87552]">
            {localError}
          </p>
        )}
        <div className="mx-auto flex max-w-4xl items-end gap-3 rounded-2xl border border-[#3A302B] bg-[#0F0D0C]/70 p-2 shadow-xl backdrop-blur-xl focus-within:border-[#C65D3B]/50">
          <textarea
            value={content}
            onChange={(event) => {
              setContent(event.target.value);
              handleTyping();
            }}
            onKeyDown={handleKeyDown}
            disabled={sending}
            rows={1}
            maxLength={5000}
            placeholder="Write a message..."
            className="max-h-32 min-h-11 flex-1 resize-none bg-transparent px-3 py-3 text-sm leading-5 text-[#F5EEE8] outline-none placeholder:text-[#A89B91]/60"
          />

          <button
            type="button"
            onClick={handleSendMessage}
            disabled={sending || !content.trim()}
            className="rounded-xl bg-[#C65D3B] px-4 py-2.5 text-sm font-semibold text-[#F5EEE8] transition hover:bg-[#D87552] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {sending ? "..." : "Send"}
          </button>
        </div>

        <p className="mx-auto mt-2 max-w-4xl px-2 text-[10px] text-[#A89B91]/60">
          Enter to send · Shift + Enter for a new line
        </p>
      </div>

      {/* Conversation details */}
      {showDetails && (
        <ConversationDetailsModal
          conversation={activeConversation}
          onClose={() => setShowDetails(false)}
          onConversationDeleted={() => {
            setShowDetails(false);
            dispatch(setActiveConversation(null));
          }}
        />
      )}
    </section>
  );
}

export default MessagePanel;
