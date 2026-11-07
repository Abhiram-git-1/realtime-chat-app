import { io } from "socket.io-client";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

let socket = null;

const connectSocket = (accessToken) => {
  if (!accessToken) {
    throw new Error("Access token is required to connect socket.");
  }

  if (socket?.connected) {
    return socket;
  }

  if (socket) {
    socket.auth = {
      token: accessToken,
    };

    socket.connect();

    return socket;
  }

  socket = io(BACKEND_URL, {
    autoConnect: false,

    auth: {
      token: accessToken,
    },

    transports: ["websocket", "polling"],
  });

  socket.on("connect", () => {
    console.log("🟢 Socket connected:", socket.id);
  });

  socket.on("connect_error", (error) => {
    console.error("🔴 Socket connection error:", error.message);
  });

  socket.on("disconnect", (reason) => {
    console.log("🟡 Socket disconnected:", reason);

    if (reason === "io server disconnect") {
      window.dispatchEvent(new CustomEvent("auth:session-revoked"));
    }
  });

  socket.connect();

  return socket;
};

const disconnectSocket = () => {
  if (!socket) {
    return;
  }

  socket.disconnect();
};

const getSocket = () => {
  return socket;
};

const isSocketConnected = () => {
  return Boolean(socket?.connected);
};

const updateSocketToken = (accessToken) => {
  if (!socket || !accessToken) {
    return;
  }

  socket.auth = {
    token: accessToken,
  };
};

const joinConversation = (conversationId) => {
  if (!socket?.connected) {
    console.warn("Socket is not connected.");
    return;
  }

  if (!conversationId) {
    return;
  }

  socket.emit("join_conversation", conversationId);
};

const leaveConversation = (conversationId) => {
  if (!socket?.connected) {
    return;
  }

  if (!conversationId) {
    return;
  }

  /*
   * Your backend does not currently expose
   * a leave_conversation event.
   *
   * Socket.IO automatically leaves the room
   * when the socket disconnects.
   *
   * For now, this function only exists so the
   * frontend room lifecycle stays explicit.
   */
};

const socketService = {
  connectSocket,
  disconnectSocket,
  getSocket,
  isSocketConnected,
  updateSocketToken,
  joinConversation,
  leaveConversation,
};

export default socketService;
