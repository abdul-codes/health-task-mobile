import { io, Socket } from "socket.io-client";

// Replace with your actual backend server URL in a .env file for production
const SERVER_URL = "http://YOUR_LOCAL_IP_ADDRESS:8000"; 

let socket: Socket;

export const getSocket = () => {
  if (!socket) {
    throw new Error("Socket not initialized. Call connectSocket first.");
  }
  return socket;
};

export const connectSocket = (token: string, userId: string): Socket => {
  console.log("Attempting to connect socket...");
  
  // Disconnect any existing socket before creating a new one
  if (socket) {
    socket.disconnect();
  }

  socket = io(SERVER_URL, {
    // We don't need auth here as we are not using socket middleware for auth
    // The user-specific room joining is what controls data flow
  });

  socket.on("connect", () => {
    console.log("Socket connected successfully:", socket.id);
    // Join a room based on the user's ID to receive targeted notifications
    socket.emit("joinRoom", userId);
  });

  socket.on("connect_error", (err) => {
    console.error("Socket connection error:", err.message);
  });

  socket.on("disconnect", (reason) => {
    console.log("Socket disconnected:", reason);
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    console.log("Disconnecting socket...");
    socket.disconnect();
  }
};
