import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import "../../../src/index.css";
function SocketTest() {
  const [token, setToken] = useState("");
  const [conversationId, setConversationId] = useState("");
  const [content, setContent] = useState("");

  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState("");
  const [typingUser, setTypingUser] = useState("null");
  const [onlineUsers, setOnlineUsers] = useState([]);

  const socketRef = useRef(null);
  const activeConversationRef = useRef("");

  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const connectSocket = () => {
    if (!token.trim()) {
      setError("Access token is required");
      return;
    }

    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    setError("");
    setMessages([]);

    const socket = io(import.meta.env.VITE_BACKEND_URL, {
      auth: {
        token: token.trim(),
      },
    });

    socketRef.current = socket;

    socket.on("connect", async () => {
      console.log("Socket connected:", socket.id);

      setConnected(true);
      setError("");

      const activeConversationId = activeConversationRef.current;

      if (!activeConversationId) {
        console.log("No active conversation to restore");
        return;
      }

      await restoreConversation(socket, activeConversationId);
    });

    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
      setConnected(false);
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error.message);
      setConnected(false);
      setError(error.message);
    });

    socket.on("new_message", (data) => {
      console.log("New message received:", data);

      const message = data.message;

      setMessages((previousMessages) => [...previousMessages, message]);

      // Acknowledge message delivery
      socket.emit("message_delivered", {
        messageId: message._id,
      });

      console.log(
        "About to mark message as read:",
        message._id,
        message.conversationId,
      );

      socket.emit("mark_messages_read", message.conversationId);

      console.log("mark_messages_read emitted:", message.conversationId);
    });

    socket.on("message_sent", (data) => {
      console.log("Message sent:", data);
      setMessages((previousMessages) => [...previousMessages, data.message]);
    });

    socket.on("user_typing", (data) => {
      console.log("user typing:", data);
      setTypingUser(data.userId);
    });
    socket.on("user_stopped_typing", (data) => {
      console.log("user stopped typing:", data);
      setTypingUser(null);
    });

    socket.on("conversation_presence", (data) => {
      console.log("Conversation presence:", data);

      const validUsers = (data.users || []).filter((user) => user && user._id);

      setOnlineUsers(validUsers);
    });

    socket.on("user_online", (data) => {
      console.log("User online:", data);

      if (!data.user || !data.user._id) {
        console.warn("Invalid user_online payload:", data);
        return;
      }

      setOnlineUsers((previousUsers) => {
        const alreadyExists = previousUsers.some(
          (user) => user && user._id === data.user._id,
        );

        if (alreadyExists) {
          return previousUsers;
        }

        return [...previousUsers, data.user];
      });
    });
    
    socket.on("user_offline", (data) => {
      console.log("User offline:", data);

      setOnlineUsers((previousUsers) =>
        previousUsers.filter((user) => user && user._id !== data.userId),
      );
    });

    socket.on("message_delivery_updated", (data) => {
      console.log("Message delivery updated:", data);

      setMessages((previousMessages) =>
        previousMessages.map((message) => {
          if (message._id !== data.messageId) {
            return message;
          }

          const updatedDeliveryStatus = (message.deliveryStatus || []).map(
            (delivery) => {
              if (delivery.userId.toString() === data.userId) {
                return {
                  ...delivery,
                  deliveredAt: data.deliveredAt,
                };
              }

              return delivery;
            },
          );

          return {
            ...message,
            deliveryStatus: updatedDeliveryStatus,
          };
        }),
      );
    });

    socket.on("messages_read", (data) => {
      console.log("Messages read:", data);

      setMessages((previousMessages) =>
        previousMessages.map((message) => {
          if (!data.messageIds.includes(message._id)) {
            return message;
          }

          const updatedDeliveryStatus = (message.deliveryStatus || []).map(
            (delivery) => {
              if (String(delivery.userId) === String(data.userId)) {
                return {
                  ...delivery,
                  readAt: data.readAt,
                };
              }

              return delivery;
            },
          );

          return {
            ...message,
            deliveryStatus: updatedDeliveryStatus,
          };
        }),
      );
    });

    socket.on("socket_error", (error) => {
      console.error("Socket error:", error.message);
      setError(error.message);
    });
  };

  const loadMessages = async (conversationId) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/conversations/${conversationId}/messages`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token.trim()}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load conversation messages");
      }

      setMessages(data.messages || []);

      return data.messages || [];
    } catch (error) {
      console.error("Load messages error:", error);
      setError(error.message);

      return null;
    }
  };

  const restoreConversation = async (socket, conversationId) => {
    try {
      console.log("Restoring conversation after reconnect:", conversationId);

      socket.emit("join_conversation", conversationId);

      const loadedMessages = await loadMessages(conversationId);

      if (loadedMessages === null) {
        console.log("Failed to restore conversation messages:", conversationId);
        return;
      }

      if (loadedMessages.length > 0) {
        console.log("Marking restored messages as read:", conversationId);

        socket.emit("mark_messages_read", conversationId);
      } else {
        console.log("Restored conversation has no messages:", conversationId);
      }
    } catch (error) {
      console.error("Restore conversation error:", error);

      setError("Failed to restore conversation");
    }
  };

  const joinConversation = async () => {
    if (!socketRef.current || !connected) {
      setError("Connect socket first");
      return;
    }

    const trimmedConversationId = conversationId.trim();

    if (!trimmedConversationId) {
      setError("Conversation ID is required");
      return;
    }

    setError("");
    setMessages([]);

    socketRef.current.emit("join_conversation", trimmedConversationId);

    console.log("Joining conversation:", trimmedConversationId);

    const loadedMessages = await loadMessages(trimmedConversationId);

    if (loadedMessages === null) {
      console.log(
        "Conversation join failed, active conversation was not changed",
      );
      return;
    }

    activeConversationRef.current = trimmedConversationId;

    if (loadedMessages.length > 0) {
      console.log("Marking messages as read:", trimmedConversationId);

      socketRef.current.emit("mark_messages_read", trimmedConversationId);
    } else {
      console.log("No messages loaded, nothing to mark as read");
    }
  };
  const sendMessage = () => {
    if (!socketRef.current || !connected) {
      setError("Connect socket first");
      return;
    }

    if (!conversationId.trim()) {
      setError("Conversation ID is required");
      return;
    }

    if (!content.trim()) {
      setError("Message cannot be empty");
      return;
    }

    socketRef.current.emit("send_message", {
      conversationId: conversationId.trim(),
      content: content.trim(),
    });

    setContent("");
    setError("");
  };

  const startTyping = () => {
    if (!socketRef.current || !connected) {
      return;
    }

    if (!conversationId.trim()) {
      return;
    }

    socketRef.current.emit("typing_start", conversationId.trim());
  };

  const stopTyping = () => {
    if (!socketRef.current || !connected) {
      return;
    }

    if (!conversationId.trim()) {
      return;
    }

    socketRef.current.emit("typing_stop", conversationId.trim());
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-2xl rounded-xl bg-white p-8 shadow-lg">
        <h1 className="text-3xl font-bold text-gray-900">
          Socket.IO Test Client
        </h1>

        <p className="mt-2 text-gray-600">Phase 3 Realtime Messaging</p>

        {/* Access Token */}
        <div className="mt-6">
          <label className="block font-medium">Access Token</label>

          <textarea
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Paste access token"
            className="mt-2 w-full rounded-lg border p-3"
            rows="4"
          />
        </div>

        {/* Connect */}
        <button
          onClick={connectSocket}
          className="mt-3 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white"
        >
          Connect Socket
        </button>

        {/* Connection status */}
        <p className="mt-3">
          Status:{" "}
          <span
            className={
              connected
                ? "font-semibold text-green-600"
                : "font-semibold text-red-600"
            }
          >
            {connected ? "Connected" : "Disconnected"}
          </span>
        </p>

        {/* Conversation */}
        <div className="mt-6">
          <label className="block font-medium">Conversation ID</label>

          <input
            type="text"
            value={conversationId}
            onChange={(e) => setConversationId(e.target.value)}
            placeholder="Enter conversation ID"
            className="mt-2 w-full rounded-lg border p-3"
          />

          <button
            onClick={joinConversation}
            className="mt-3 rounded-lg bg-green-600 px-4 py-2 font-medium text-white"
          >
            Join Conversation
          </button>
        </div>
        <div className="mt-6">
          <h2 className="text-xl font-semibold">Typing Test</h2>

          <button
            onClick={startTyping}
            className="mt-3 mr-3 rounded-lg bg-yellow-500 px-4 py-2 font-medium text-white"
          >
            Start Typing
          </button>

          <button
            onClick={stopTyping}
            className="mt-3 rounded-lg bg-gray-600 px-4 py-2 font-medium text-white"
          >
            Stop Typing
          </button>

          {typingUser && (
            <p className="mt-3 text-gray-600">User {typingUser} is typing...</p>
          )}
        </div>

        <div className="mt-6">
          <h2 className="text-xl font-semibold">Online Users</h2>

          {onlineUsers.length === 0 ? (
            <p className="mt-2 text-gray-500">No other users online.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {onlineUsers
                .filter((user) => user && user._id)
                .map((user) => (
                  <li key={user._id} className="text-green-600">
                    ● {user.name || user.username || "Unknown user"} is online
                  </li>
                ))}
            </ul>
          )}
        </div>

        {/* Message */}
        <div className="mt-6">
          <label className="block font-medium">Message</label>

          <input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Type a message"
            className="mt-2 w-full rounded-lg border p-3"
          />

          <button
            onClick={sendMessage}
            className="mt-3 rounded-lg bg-purple-600 px-4 py-2 font-medium text-white"
          >
            Send Message
          </button>
        </div>

        {/* Error */}
        {error && (
          <p className="mt-4 rounded-lg bg-red-100 p-3 text-red-700">{error}</p>
        )}

        {/* Received messages */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold">Received Messages</h2>

          <div className="mt-3 space-y-3">
            {messages.length === 0 ? (
              <p className="text-gray-500">No messages received yet.</p>
            ) : (
              messages.map((message) => (
                <div key={message._id} className="rounded-lg bg-gray-100 p-3">
                  <p className="font-medium">
                    {message.senderId?.name ||
                      message.senderId?.username ||
                      "Unknown user"}
                  </p>

                  <p className="mt-1">{message.content}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SocketTest;