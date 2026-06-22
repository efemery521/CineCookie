import { useEffect, useRef, useCallback } from "react";
import { io, type Socket } from "socket.io-client";
import { useStore } from "@/store/useStore";

const SOCKET_URL = import.meta.env.PROD ? window.location.origin : "http://localhost:3000";

let socketInstance: Socket | null = null;

function getSocket(): Socket {
  if (!socketInstance) {
    socketInstance = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
  }
  return socketInstance;
}

export function useSocket() {
  const socketRef = useRef<Socket>(getSocket());
  const store = useStore();

  useEffect(() => {
    const socket = socketRef.current;

    const onConnect = () => {
      console.log("Socket connected");
      store.setConnectionStatus("connected");
    };

    const onDisconnect = () => {
      console.log("Socket disconnected");
      store.setConnectionStatus("disconnected");
      store.setPartnerConnected(false);
    };

    const onReconnecting = () => {
      store.setConnectionStatus("reconnecting");
    };

    const onGuestJoined = (data: { nickname: string }) => {
      store.setPartnerNickname(data.nickname);
      store.setPartnerConnected(true);
    };

    const onSessionReady = (data: {
      roomCode: string;
      hostNickname: string;
      guestNickname: string;
    }) => {
      store.setRoomCode(data.roomCode);
      store.setPartnerNickname(
        store.role === "host" ? data.guestNickname : data.hostNickname
      );
      store.setPartnerConnected(true);
      store.setSessionStartTime(Date.now());
      store.setScreen("session");
    };

    const onUrlUpdated = (data: { url: string }) => {
      store.setCurrentUrl(data.url);
    };

    const onVideoSync = (data: {
      type: "play" | "pause" | "seek" | "ratechange";
      currentTime?: number;
      playbackRate?: number;
      timestamp: number;
    }) => {
      store.setVideoState({
        isPlaying: data.type === "play",
        currentTime: data.currentTime ?? store.videoState.currentTime,
        playbackRate: data.playbackRate ?? store.videoState.playbackRate,
        timestamp: data.timestamp,
      });
    };

    const onNewMessage = (msg: {
      id: string;
      sender: string;
      senderRole: "host" | "guest";
      content: string;
      timestamp: number;
    }) => {
      store.addMessage(msg);
    };

    const onUserTyping = (data: { role: "host" | "guest"; isTyping: boolean }) => {
      if (data.role !== store.role) {
        store.setPartnerTyping(data.isTyping);
      }
    };

    const onNewReaction = (reaction: {
      emoji: string;
      sender: string;
      timestamp: number;
    }) => {
      store.addReaction(reaction);
    };

    const onHostDisconnected = () => {
      store.setPartnerConnected(false);
      store.setPartnerNickname(null);
    };

    const onGuestDisconnected = () => {
      store.setPartnerConnected(false);
      store.setPartnerNickname(null);
    };

    const onNoteAdded = (note: {
      id: string;
      content: string;
      author: string;
      timestamp: number;
      position: { x: number; y: number };
    }) => {
      store.addNote(note);
    };

    const onNoteDeleted = (data: { noteId: string }) => {
      store.deleteNote(data.noteId);
    };

    // Register listeners
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("reconnecting", onReconnecting);
    socket.on("guest-joined", onGuestJoined);
    socket.on("session-ready", onSessionReady);
    socket.on("url-updated", onUrlUpdated);
    socket.on("video-sync", onVideoSync);
    socket.on("new-message", onNewMessage);
    socket.on("user-typing", onUserTyping);
    socket.on("new-reaction", onNewReaction);
    socket.on("host-disconnected", onHostDisconnected);
    socket.on("guest-disconnected", onGuestDisconnected);
    socket.on("note-added", onNoteAdded);
    socket.on("note-deleted", onNoteDeleted);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("reconnecting", onReconnecting);
      socket.off("guest-joined", onGuestJoined);
      socket.off("session-ready", onSessionReady);
      socket.off("url-updated", onUrlUpdated);
      socket.off("video-sync", onVideoSync);
      socket.off("new-message", onNewMessage);
      socket.off("user-typing", onUserTyping);
      socket.off("new-reaction", onNewReaction);
      socket.off("host-disconnected", onHostDisconnected);
      socket.off("guest-disconnected", onGuestDisconnected);
      socket.off("note-added", onNoteAdded);
      socket.off("note-deleted", onNoteDeleted);
    };
  }, []);

  const createRoom = useCallback(
    (url: string, nickname: string): Promise<{ success: boolean; roomCode?: string; error?: string }> => {
      return new Promise((resolve) => {
        socketRef.current.emit("create-room", { url, nickname }, (response: { success: boolean; roomCode?: string; error?: string }) => {
          resolve(response);
        });
      });
    },
    []
  );

  const joinRoom = useCallback(
    (
      roomCode: string,
      nickname: string
    ): Promise<{
      success: boolean;
      url?: string;
      hostNickname?: string;
      videoState?: { isPlaying: boolean; currentTime: number; playbackRate: number };
      messages?: Array<{
        id: string;
        sender: string;
        senderRole: "host" | "guest";
        content: string;
        timestamp: number;
      }>;
      notes?: Array<{
        id: string;
        content: string;
        author: string;
        timestamp: number;
        position: { x: number; y: number };
      }>;
      error?: string;
    }> => {
      return new Promise((resolve) => {
        socketRef.current.emit(
          "join-room",
          { roomCode: roomCode.toUpperCase(), nickname },
          (response: {
            success: boolean;
            url?: string;
            hostNickname?: string;
            videoState?: { isPlaying: boolean; currentTime: number; playbackRate: number };
            messages?: Array<{
              id: string;
              sender: string;
              senderRole: "host" | "guest";
              content: string;
              timestamp: number;
            }>;
            notes?: Array<{
              id: string;
              content: string;
              author: string;
              timestamp: number;
              position: { x: number; y: number };
            }>;
            error?: string;
          }) => {
            resolve(response);
          }
        );
      });
    },
    []
  );

  const updateUrl = useCallback((url: string) => {
    socketRef.current.emit("update-url", { url });
  }, []);

  const sendVideoEvent = useCallback(
    (data: {
      type: "play" | "pause" | "seek" | "ratechange";
      currentTime?: number;
      playbackRate?: number;
    }) => {
      socketRef.current.emit("video-event", data);
    },
    []
  );

  const sendMessage = useCallback(
    (content: string): Promise<{ success: boolean; message?: { id: string; sender: string; senderRole: "host" | "guest"; content: string; timestamp: number }; error?: string }> => {
      return new Promise((resolve) => {
        socketRef.current.emit("send-message", { content }, (response: { success: boolean; message?: { id: string; sender: string; senderRole: "host" | "guest"; content: string; timestamp: number }; error?: string }) => {
          resolve(response);
        });
      });
    },
    []
  );

  const sendTyping = useCallback((isTyping: boolean) => {
    socketRef.current.emit("typing", { isTyping });
  }, []);

  const sendReaction = useCallback((emoji: string) => {
    socketRef.current.emit("send-reaction", { emoji });
  }, []);

  const sendCursorMove = useCallback((x: number, y: number) => {
    socketRef.current.emit("cursor-move", { x, y });
  }, []);

  const addNote = useCallback(
    (content: string, position: { x: number; y: number }) => {
      socketRef.current.emit("add-note", { content, position });
    },
    []
  );

  const deleteNote = useCallback((noteId: string) => {
    socketRef.current.emit("delete-note", { noteId });
  }, []);

  // WebRTC signaling
  const sendWebRTCOffer = useCallback(
    (offer: RTCSessionDescriptionInit, targetRole: "host" | "guest") => {
      socketRef.current.emit("webrtc-offer", { offer, targetRole });
    },
    []
  );

  const sendWebRTCAnswer = useCallback(
    (answer: RTCSessionDescriptionInit, targetRole: "host" | "guest") => {
      socketRef.current.emit("webrtc-answer", { answer, targetRole });
    },
    []
  );

  const sendWebRTCIceCandidate = useCallback(
    (candidate: RTCIceCandidateInit, targetRole: "host" | "guest") => {
      socketRef.current.emit("webrtc-ice-candidate", { candidate, targetRole });
    },
    []
  );

  return {
    socket: socketRef.current,
    createRoom,
    joinRoom,
    updateUrl,
    sendVideoEvent,
    sendMessage,
    sendTyping,
    sendReaction,
    sendCursorMove,
    addNote,
    deleteNote,
    sendWebRTCOffer,
    sendWebRTCAnswer,
    sendWebRTCIceCandidate,
  };
}
