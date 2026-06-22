import { create } from "zustand";
import type {
  ChatMessage,
  Reaction,
  Note,
  VideoState,
  UserRole,
  ConnectionStatus,
  AppScreen,
} from "@/types";

interface AppState {
  // Navigation
  screen: AppScreen;
  setScreen: (screen: AppScreen) => void;

  // Room
  roomCode: string | null;
  setRoomCode: (code: string | null) => void;

  // User
  nickname: string;
  setNickname: (name: string) => void;
  role: UserRole;
  setRole: (role: UserRole) => void;

  // Connection
  connectionStatus: ConnectionStatus;
  setConnectionStatus: (status: ConnectionStatus) => void;

  // Partner
  partnerNickname: string | null;
  setPartnerNickname: (name: string | null) => void;
  partnerConnected: boolean;
  setPartnerConnected: (connected: boolean) => void;

  // URL
  currentUrl: string;
  setCurrentUrl: (url: string) => void;

  // Chat
  messages: ChatMessage[];
  addMessage: (msg: ChatMessage) => void;
  clearMessages: () => void;
  isTyping: boolean;
  setIsTyping: (typing: boolean) => void;
  partnerTyping: boolean;
  setPartnerTyping: (typing: boolean) => void;

  // Reactions
  reactions: Reaction[];
  addReaction: (reaction: Reaction) => void;

  // Notes
  notes: Note[];
  addNote: (note: Note) => void;
  deleteNote: (id: string) => void;

  // Video state
  videoState: VideoState;
  setVideoState: (state: Partial<VideoState>) => void;

  // Session
  sessionStartTime: number | null;
  setSessionStartTime: (time: number | null) => void;

  // UI
  isChatOpen: boolean;
  setIsChatOpen: (open: boolean) => void;
  isMovieNightMode: boolean;
  setIsMovieNightMode: (mode: boolean) => void;
  isCursorSharingEnabled: boolean;
  setIsCursorSharingEnabled: (enabled: boolean) => void;
  isVoiceEnabled: boolean;
  setIsVoiceEnabled: (enabled: boolean) => void;

  // Recent rooms
  recentRooms: string[];
  addRecentRoom: (code: string) => void;

  // Reset
  reset: () => void;
}

const initialState = {
  screen: "landing" as AppScreen,
  roomCode: null,
  nickname: "",
  role: null as UserRole,
  connectionStatus: "disconnected" as ConnectionStatus,
  partnerNickname: null,
  partnerConnected: false,
  currentUrl: "",
  messages: [],
  isTyping: false,
  partnerTyping: false,
  reactions: [],
  notes: [],
  videoState: {
    isPlaying: false,
    currentTime: 0,
    playbackRate: 1,
    timestamp: Date.now(),
  },
  sessionStartTime: null,
  isChatOpen: true,
  isMovieNightMode: false,
  isCursorSharingEnabled: false,
  isVoiceEnabled: false,
  recentRooms: JSON.parse(localStorage.getItem("cinecookie-recent-rooms") || "[]"),
};

export const useStore = create<AppState>((set) => ({
  ...initialState,

  setScreen: (screen) => set({ screen }),
  setRoomCode: (code) => set({ roomCode: code }),
  setNickname: (name) => set({ nickname: name }),
  setRole: (role) => set({ role }),
  setConnectionStatus: (status) => set({ connectionStatus: status }),
  setPartnerNickname: (name) => set({ partnerNickname: name }),
  setPartnerConnected: (connected) => set({ partnerConnected: connected }),
  setCurrentUrl: (url) => set({ currentUrl: url }),
  addMessage: (msg) =>
    set((state) => ({ messages: [...state.messages, msg] })),
  clearMessages: () => set({ messages: [] }),
  setIsTyping: (typing) => set({ isTyping: typing }),
  setPartnerTyping: (typing) => set({ partnerTyping: typing }),
  addReaction: (reaction) =>
    set((state) => ({ reactions: [...state.reactions, reaction] })),
  addNote: (note) => set((state) => ({ notes: [...state.notes, note] })),
  deleteNote: (id) =>
    set((state) => ({ notes: state.notes.filter((n) => n.id !== id) })),
  setVideoState: (state) =>
    set((prev) => ({ videoState: { ...prev.videoState, ...state } })),
  setSessionStartTime: (time) => set({ sessionStartTime: time }),
  setIsChatOpen: (open) => set({ isChatOpen: open }),
  setIsMovieNightMode: (mode) => set({ isMovieNightMode: mode }),
  setIsCursorSharingEnabled: (enabled) =>
    set({ isCursorSharingEnabled: enabled }),
  setIsVoiceEnabled: (enabled) => set({ isVoiceEnabled: enabled }),
  addRecentRoom: (code) =>
    set((state) => {
      const updated = [code, ...state.recentRooms.filter((r) => r !== code)].slice(0, 10);
      localStorage.setItem("cinecookie-recent-rooms", JSON.stringify(updated));
      return { recentRooms: updated };
    }),

  reset: () => {
    set({
      ...initialState,
      recentRooms: JSON.parse(localStorage.getItem("cinecookie-recent-rooms") || "[]"),
    });
  },
}));
