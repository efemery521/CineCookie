import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NODE_ENV === "production" ? true : ["http://localhost:5173", "http://localhost:3000"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
  pingTimeout: 60000,
  pingInterval: 25000,
});

app.use(cors());
app.use(express.json());


if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../dist/index.html"));
  });
}

// Types
interface Room {
  id: string;
  hostId: string;
  guestId: string | null;
  url: string;
  createdAt: number;
  lastActivity: number;
  hostNickname: string;
  guestNickname: string | null;
  messages: ChatMessage[];
  reactions: Reaction[];
  notes: Note[];
  videoState: VideoState;
  cursors: Record<string, CursorPosition>;
}

interface ChatMessage {
  id: string;
  sender: string;
  senderRole: "host" | "guest";
  content: string;
  timestamp: number;
}

interface Reaction {
  emoji: string;
  sender: string;
  timestamp: number;
}

interface Note {
  id: string;
  content: string;
  author: string;
  timestamp: number;
  position: { x: number; y: number };
}

interface VideoState {
  isPlaying: boolean;
  currentTime: number;
  playbackRate: number;
  timestamp: number;
}

interface CursorPosition {
  x: number;
  y: number;
  timestamp: number;
}

// In-memory storage
const rooms = new Map<string, Room>();
const socketToRoom = new Map<string, string>();
const socketToRole = new Map<string, "host" | "guest">();

// Generate random room code
function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  code += "-";
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Cleanup inactive rooms periodically
setInterval(() => {
  const now = Date.now();
  for (const [roomId, room] of rooms.entries()) {
    if (now - room.lastActivity > 24 * 60 * 60 * 1000) {
      // 24 hours
      rooms.delete(roomId);
    }
  }
}, 60 * 60 * 1000); // Every hour

io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // Heartbeat
  socket.on("ping", () => {
    socket.emit("pong");
  });

  // Create room (Host)
  socket.on(
    "create-room",
    (data: { url: string; nickname: string }, callback) => {
      try {
        const roomCode = generateRoomCode();
        const room: Room = {
          id: roomCode,
          hostId: socket.id,
          guestId: null,
          url: data.url,
          createdAt: Date.now(),
          lastActivity: Date.now(),
          hostNickname: data.nickname || "Host",
          guestNickname: null,
          messages: [],
          reactions: [],
          notes: [],
          videoState: {
            isPlaying: false,
            currentTime: 0,
            playbackRate: 1,
            timestamp: Date.now(),
          },
          cursors: {},
        };

        rooms.set(roomCode, room);
        socketToRoom.set(socket.id, roomCode);
        socketToRole.set(socket.id, "host");
        socket.join(roomCode);

        callback({ success: true, roomCode });
      } catch (error) {
        callback({
          success: false,
          error: "Failed to create room",
        });
      }
    }
  );

  // Join room (Guest)
  socket.on(
    "join-room",
    (data: { roomCode: string; nickname: string }, callback) => {
      try {
        const room = rooms.get(data.roomCode.toUpperCase());

        if (!room) {
          callback({ success: false, error: "Room not found" });
          return;
        }

        if (room.guestId) {
          callback({ success: false, error: "Room is full" });
          return;
        }

        room.guestId = socket.id;
        room.guestNickname = data.nickname || "Guest";
        room.lastActivity = Date.now();

        socketToRoom.set(socket.id, room.id);
        socketToRole.set(socket.id, "guest");
        socket.join(room.id);

        // Notify host that guest joined
        socket.to(room.hostId).emit("guest-joined", {
          nickname: room.guestNickname,
        });

        // Send room state to guest
        callback({
          success: true,
          url: room.url,
          hostNickname: room.hostNickname,
          videoState: room.videoState,
          messages: room.messages,
          notes: room.notes,
        });

        // Notify both that session is ready
        io.to(room.id).emit("session-ready", {
          roomCode: room.id,
          hostNickname: room.hostNickname,
          guestNickname: room.guestNickname,
        });
      } catch (error) {
        callback({ success: false, error: "Failed to join room" });
      }
    }
  );

  // Update URL
  socket.on("update-url", (data: { url: string }) => {
    const roomCode = socketToRoom.get(socket.id);
    const role = socketToRole.get(socket.id);
    if (!roomCode || role !== "host") return;

    const room = rooms.get(roomCode);
    if (!room) return;

    room.url = data.url;
    room.lastActivity = Date.now();
    socket.to(roomCode).emit("url-updated", { url: data.url });
  });

  // Video sync events (host only controls)
  socket.on(
    "video-event",
    (data: {
      type: "play" | "pause" | "seek" | "ratechange";
      currentTime?: number;
      playbackRate?: number;
    }) => {
      const roomCode = socketToRoom.get(socket.id);
      const role = socketToRole.get(socket.id);
      if (!roomCode) return;

      const room = rooms.get(roomCode);
      if (!room) return;

      // Only host controls sync, but allow guest to request
      room.lastActivity = Date.now();
      room.videoState = {
        ...room.videoState,
        currentTime: data.currentTime ?? room.videoState.currentTime,
        playbackRate: data.playbackRate ?? room.videoState.playbackRate,
        isPlaying: data.type === "play",
        timestamp: Date.now(),
      };

      // Broadcast to others in room
      socket.to(roomCode).emit("video-sync", {
        ...data,
        timestamp: Date.now(),
      });
    }
  );

  // Chat messages
  socket.on(
    "send-message",
    (data: { content: string }, callback) => {
      const roomCode = socketToRoom.get(socket.id);
      const role = socketToRole.get(socket.id);
      if (!roomCode || !role) return;

      const room = rooms.get(roomCode);
      if (!room) return;

      const message: ChatMessage = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        sender: role === "host" ? room.hostNickname : (room.guestNickname || "Guest"),
        senderRole: role,
        content: data.content,
        timestamp: Date.now(),
      };

      room.messages.push(message);
      room.lastActivity = Date.now();

      // Broadcast to all in room
      io.to(roomCode).emit("new-message", message);
      callback({ success: true, message });
    }
  );

  // Typing indicator
  socket.on("typing", (data: { isTyping: boolean }) => {
    const roomCode = socketToRoom.get(socket.id);
    const role = socketToRole.get(socket.id);
    if (!roomCode || !role) return;

    socket.to(roomCode).emit("user-typing", {
      role,
      isTyping: data.isTyping,
    });
  });

  // Reactions
  socket.on("send-reaction", (data: { emoji: string }) => {
    const roomCode = socketToRoom.get(socket.id);
    const role = socketToRole.get(socket.id);
    if (!roomCode || !role) return;

    const room = rooms.get(roomCode);
    if (!room) return;

    const reaction: Reaction = {
      emoji: data.emoji,
      sender: role,
      timestamp: Date.now(),
    };

    room.reactions.push(reaction);
    io.to(roomCode).emit("new-reaction", reaction);
  });

  // Cursor sharing
  socket.on("cursor-move", (data: { x: number; y: number }) => {
    const roomCode = socketToRoom.get(socket.id);
    const role = socketToRole.get(socket.id);
    if (!roomCode || !role) return;

    const room = rooms.get(roomCode);
    if (!room) return;

    room.cursors[role] = {
      x: data.x,
      y: data.y,
      timestamp: Date.now(),
    };

    socket.to(roomCode).emit("cursor-update", {
      role,
      x: data.x,
      y: data.y,
    });
  });

  // WebRTC signaling
  socket.on("webrtc-offer", (data: { offer: RTCSessionDescriptionInit; targetRole: "host" | "guest" }) => {
    const roomCode = socketToRoom.get(socket.id);
    if (!roomCode) return;

    const room = rooms.get(roomCode);
    if (!room) return;

    const targetId = data.targetRole === "host" ? room.hostId : room.guestId;
    if (targetId) {
      socket.to(targetId).emit("webrtc-offer", {
        offer: data.offer,
        fromRole: socketToRole.get(socket.id),
      });
    }
  });

  socket.on("webrtc-answer", (data: { answer: RTCSessionDescriptionInit; targetRole: "host" | "guest" }) => {
    const roomCode = socketToRoom.get(socket.id);
    if (!roomCode) return;

    const room = rooms.get(roomCode);
    if (!room) return;

    const targetId = data.targetRole === "host" ? room.hostId : room.guestId;
    if (targetId) {
      socket.to(targetId).emit("webrtc-answer", {
        answer: data.answer,
        fromRole: socketToRole.get(socket.id),
      });
    }
  });

  socket.on("webrtc-ice-candidate", (data: { candidate: RTCIceCandidateInit; targetRole: "host" | "guest" }) => {
    const roomCode = socketToRoom.get(socket.id);
    if (!roomCode) return;

    const room = rooms.get(roomCode);
    if (!room) return;

    const targetId = data.targetRole === "host" ? room.hostId : room.guestId;
    if (targetId) {
      socket.to(targetId).emit("webrtc-ice-candidate", {
        candidate: data.candidate,
        fromRole: socketToRole.get(socket.id),
      });
    }
  });

  // Notes
  socket.on("add-note", (data: { content: string; position: { x: number; y: number } }) => {
    const roomCode = socketToRoom.get(socket.id);
    const role = socketToRole.get(socket.id);
    if (!roomCode || !role) return;

    const room = rooms.get(roomCode);
    if (!room) return;

    const note: Note = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      content: data.content,
      author: role === "host" ? room.hostNickname : (room.guestNickname || "Guest"),
      timestamp: Date.now(),
      position: data.position,
    };

    room.notes.push(note);
    io.to(roomCode).emit("note-added", note);
  });

  socket.on("delete-note", (data: { noteId: string }) => {
    const roomCode = socketToRoom.get(socket.id);
    if (!roomCode) return;

    const room = rooms.get(roomCode);
    if (!room) return;

    room.notes = room.notes.filter((n) => n.id !== data.noteId);
    io.to(roomCode).emit("note-deleted", { noteId: data.noteId });
  });

  // Disconnect
  socket.on("disconnect", () => {
    console.log(`Socket disconnected: ${socket.id}`);

    const roomCode = socketToRoom.get(socket.id);
    const role = socketToRole.get(socket.id);

    if (roomCode && role) {
      const room = rooms.get(roomCode);
      if (room) {
        if (role === "host") {
          // Host left - notify guest and mark host as disconnected
          socket.to(roomCode).emit("host-disconnected");
          room.hostId = "";
        } else if (role === "guest") {
          // Guest left
          socket.to(roomCode).emit("guest-disconnected");
          room.guestId = null;
          room.guestNickname = null;
        }
        room.lastActivity = Date.now();
      }

      socketToRoom.delete(socket.id);
      socketToRole.delete(socket.id);
    }
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`CineCookie server running on port ${PORT}`);
});
