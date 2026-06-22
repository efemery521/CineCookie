export interface ChatMessage {
  id: string;
  sender: string;
  senderRole: "host" | "guest";
  content: string;
  timestamp: number;
}

export interface Reaction {
  emoji: string;
  sender: string;
  timestamp: number;
}

export interface Note {
  id: string;
  content: string;
  author: string;
  timestamp: number;
  position: { x: number; y: number };
}

export interface VideoState {
  isPlaying: boolean;
  currentTime: number;
  playbackRate: number;
  timestamp: number;
}

export interface CursorPosition {
  x: number;
  y: number;
  timestamp: number;
}

export type UserRole = "host" | "guest" | null;

export type ConnectionStatus = "connecting" | "connected" | "disconnected" | "reconnecting";

export type AppScreen = "landing" | "host" | "join" | "lobby" | "session";
