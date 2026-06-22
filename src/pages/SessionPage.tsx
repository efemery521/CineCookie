import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/store/useStore";
import { useSocket } from "@/hooks/useSocket";
import { useTheme } from "@/providers/ThemeProvider";
import { ChatPanel } from "@/components/ChatPanel";
import { ReactionBar } from "@/components/ReactionBar";
import { SessionTimer } from "@/components/SessionTimer";
import { VoiceControls } from "@/components/VoiceControls";
import {
  Moon,
  Sun,
  MessageSquare,
  MessageSquareOff,
  LogOut,
  Copy,
  Check,
  Wifi,
  WifiOff,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { toast } from "sonner";

export function SessionPage() {
  const {
    roomCode,
    role,
    currentUrl,
    partnerConnected,
    partnerNickname,
    isChatOpen,
    setIsChatOpen,
    isMovieNightMode,
    setIsMovieNightMode,
    isCursorSharingEnabled,
    setIsCursorSharingEnabled,
    isVoiceEnabled,
    setIsVoiceEnabled,
    sessionStartTime,
    setScreen,
    reset,
  } = useStore();

  const { theme, toggleTheme } = useTheme();
  const { updateUrl, sendVideoEvent, sendCursorMove, socket } = useSocket();
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [urlInput, setUrlInput] = useState(currentUrl);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync URL changes
  useEffect(() => {
    setUrlInput(currentUrl);
  }, [currentUrl]);

  // Handle iframe video events (simplified - in a real app you'd use postMessage)
  useEffect(() => {
    if (!iframeRef.current) return;

    const handleMessage = (event: MessageEvent) => {
      // Handle messages from iframe if needed
      if (event.data?.type === "video-event") {
        sendVideoEvent({
          type: event.data.action,
          currentTime: event.data.currentTime,
        });
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [sendVideoEvent]);

  // Cursor sharing
  useEffect(() => {
    if (!isCursorSharingEnabled || !containerRef.current) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = containerRef.current!.getBoundingClientRect();
      sendCursorMove(
        ((e.clientX - rect.left) / rect.width) * 100,
        ((e.clientY - rect.top) / rect.height) * 100
      );
    };

    const container = containerRef.current;
    container.addEventListener("mousemove", handleMouseMove);
    return () => container.removeEventListener("mousemove", handleMouseMove);
  }, [isCursorSharingEnabled, sendCursorMove]);

  const handleCopyCode = async () => {
    if (!roomCode) return;
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      toast.success("Room code copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleUrlUpdate = () => {
    if (!urlInput.trim()) return;
    let finalUrl = urlInput.trim();
    if (!finalUrl.startsWith("http://") && !finalUrl.startsWith("https://")) {
      finalUrl = "https://" + finalUrl;
    }
    updateUrl(finalUrl);
    toast.success("URL updated!");
  };

  const handleLeave = () => {
    socket?.disconnect();
    reset();
    setScreen("landing");
    // Reconnect socket for future use
    setTimeout(() => socket?.connect(), 100);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handler = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`h-screen flex flex-col bg-background overflow-hidden ${
        isMovieNightMode ? "movie-night-mode" : ""
      }`}
    >
      {/* Movie Night Mode Overlay */}
      <AnimatePresence>
        {isMovieNightMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="movie-night-overlay"
          />
        )}
      </AnimatePresence>

      {/* Top Bar */}
      <AnimatePresence>
        {!isMovieNightMode && (
          <motion.header
            initial={{ y: -60 }}
            animate={{ y: 0 }}
            exit={{ y: -60 }}
            className="flex items-center justify-between px-4 py-2 bg-card/80 backdrop-blur-sm border-b border-border z-50"
          >
            {/* Left: Logo & Room Info */}
            <div className="flex items-center gap-3">
              <img
                src="/assets/cookie-logo.png"
                alt="CineCookie"
                className="w-8 h-8 image-pixelated"
              />
              <div className="hidden sm:flex items-center gap-2">
                <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
                  {roomCode}
                </code>
                <button
                  onClick={handleCopyCode}
                  className="p-1 rounded hover:bg-muted transition-colors"
                >
                  {copied ? (
                    <Check className="w-3 h-3 text-emerald-500" />
                  ) : (
                    <Copy className="w-3 h-3 text-muted-foreground" />
                  )}
                </button>
              </div>
            </div>

            {/* Center: Connection & Partner */}
            <div className="flex items-center gap-3">
              <SessionTimer startTime={sessionStartTime} />
              <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-muted">
                {partnerConnected ? (
                  <Wifi className="w-3 h-3 text-emerald-500" />
                ) : (
                  <WifiOff className="w-3 h-3 text-red-500" />
                )}
                <span className="text-xs text-muted-foreground">
                  {partnerConnected
                    ? partnerNickname || "Connected"
                    : "Waiting..."}
                </span>
              </div>
            </div>

            {/* Right: Controls */}
            <div className="flex items-center gap-1">
              {/* Voice Toggle */}
              <button
                onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
                className={`p-2 rounded-lg transition-colors ${
                  isVoiceEnabled
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-muted text-muted-foreground"
                }`}
                title="Voice Chat"
              >
                {isVoiceEnabled ? (
                  <Wifi className="w-4 h-4" />
                ) : (
                  <WifiOff className="w-4 h-4" />
                )}
              </button>

              {/* Chat Toggle */}
              <button
                onClick={() => setIsChatOpen(!isChatOpen)}
                className={`p-2 rounded-lg transition-colors ${
                  isChatOpen
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-muted text-muted-foreground"
                }`}
                title="Toggle Chat"
              >
                {isChatOpen ? (
                  <MessageSquare className="w-4 h-4" />
                ) : (
                  <MessageSquareOff className="w-4 h-4" />
                )}
              </button>

              {/* Cursor Sharing */}
              <button
                onClick={() => setIsCursorSharingEnabled(!isCursorSharingEnabled)}
                className={`p-2 rounded-lg transition-colors hidden sm:flex ${
                  isCursorSharingEnabled
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-muted text-muted-foreground"
                }`}
                title="Cursor Sharing"
              >
                {isCursorSharingEnabled ? (
                  <Eye className="w-4 h-4" />
                ) : (
                  <EyeOff className="w-4 h-4" />
                )}
              </button>

              {/* Movie Night Mode */}
              <button
                onClick={() => setIsMovieNightMode(!isMovieNightMode)}
                className={`p-2 rounded-lg transition-colors ${
                  isMovieNightMode
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-muted text-muted-foreground"
                }`}
                title="Movie Night Mode"
              >
                {isMovieNightMode ? (
                  <Eye className="w-4 h-4" />
                ) : (
                  <EyeOff className="w-4 h-4" />
                )}
              </button>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
                title="Toggle Theme"
              >
                {theme === "dark" ? (
                  <Sun className="w-4 h-4" />
                ) : (
                  <Moon className="w-4 h-4" />
                )}
              </button>

              {/* Fullscreen */}
              <button
                onClick={toggleFullscreen}
                className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
                title="Fullscreen"
              >
                {isFullscreen ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </button>

              {/* Leave */}
              <button
                onClick={handleLeave}
                className="p-2 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors"
                title="Leave Session"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Video / Content Area */}
        <div className="flex-1 flex flex-col relative">
          {/* URL Bar (Host Only) */}
          {role === "host" && !isMovieNightMode && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 px-4 py-2 bg-card/50 border-b border-border"
            >
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="Enter URL..."
                className="flex-1 pixel-input text-xs py-2"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleUrlUpdate();
                }}
              />
              <button
                onClick={handleUrlUpdate}
                className="pixel-btn text-xs py-2 px-4"
              >
                Update
              </button>
            </motion.div>
          )}

          {/* Iframe */}
          <div className="flex-1 relative bg-black">
            {currentUrl ? (
              <iframe
                ref={iframeRef}
                src={currentUrl}
                className="w-full h-full border-0"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation"
                allow="fullscreen; autoplay; encrypted-media"
                title="Shared Content"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground gap-4">
                <img
                  src="/assets/cookie-logo.png"
                  alt=""
                  className="w-24 h-24 image-pixelated opacity-30"
                />
                <p className="text-sm">No content loaded yet</p>
                {role === "host" && (
                  <p className="text-xs">Enter a URL above to get started</p>
                )}
              </div>
            )}

            {/* Reaction Overlay */}
            <ReactionBar />
          </div>

          {/* Floating Controls for Movie Night Mode */}
          <AnimatePresence>
            {isMovieNightMode && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-card/90 backdrop-blur-sm rounded-full px-4 py-2 border border-border shadow-lg z-50"
              >
                <button
                  onClick={() => setIsMovieNightMode(false)}
                  className="p-2 rounded-full hover:bg-muted transition-colors"
                  title="Exit Movie Night Mode"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsChatOpen(!isChatOpen)}
                  className="p-2 rounded-full hover:bg-muted transition-colors"
                >
                  {isChatOpen ? (
                    <MessageSquare className="w-4 h-4" />
                  ) : (
                    <MessageSquareOff className="w-4 h-4" />
                  )}
                </button>
                <SessionTimer startTime={sessionStartTime} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Chat Panel */}
        <AnimatePresence>
          {isChatOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="border-l border-border bg-card/50 backdrop-blur-sm overflow-hidden"
            >
              <ChatPanel />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Voice Controls Overlay */}
      <AnimatePresence>
        {isVoiceEnabled && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute top-16 right-4 z-50"
          >
            <VoiceControls />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
