require("dotenv").config();

const http = require("http");
const { Server } = require("socket.io");

const connectDB = require("./config/database");
const app = require("./app");

const socketAuthenticate = require("./middleware/socketAuth");
const registerConversationSocket = require("./socket/conversationSocket");
const presence = require("./socket/presence");

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true,
  },
});
app.set("io", io);
io.use(socketAuthenticate);

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);
  console.log("Handshake:", socket.handshake.auth);
  console.log("Authenticated:", socket.user.userId);

  const userId = socket.user.userId;
  presence.addUser(userId, socket.id);
  console.log(`User ${userId} is online`);

  registerConversationSocket(io, socket);

  socket.on("ping", (data) => {
    console.log("Ping received:", data);
    socket.emit("pong", {
      message: "Pong from server",
    });
  });

  socket.on("disconnecting", () => {
    const userId = socket.user.userId;

    // Save the rooms before the socket leaves them
    const conversationRooms = [...socket.rooms].filter(
      (roomId) => roomId !== socket.id,
    );

    const becameOffline = presence.removeUser(userId, socket.id);

    // Only notify others if this was the user's LAST socket
    if (becameOffline) {
      for (const conversationId of conversationRooms) {
        socket.to(conversationId).emit("user_offline", {
          conversationId,
          userId,
        });
      }

      console.log(`User ${userId} is offline`);
    }
  });

  socket.on("disconnect", (reason) => {
    console.log("Socket disconnected:", socket.id);
    console.log("Disconnect reason:", reason);
  });
});
const startServer = async () => {
  await connectDB();

  server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
};

startServer();
