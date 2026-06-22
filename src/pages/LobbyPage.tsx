import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/store/useStore";
import { useSocket } from "@/hooks/useSocket";
import { Copy, Check, Users, Wifi, WifiOff, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export function LobbyPage() {
  const { roomCode, role, partnerConnected, partnerNickname, setScreen, reset } = useStore();
  const { socket } = useSocket();
  const [copied, setCopied] = useState(false);
  const [dots, setDots] = useState(".");

  // Animated dots for waiting
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "." : prev + "."));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Listen for guest join as host
  useEffect(() => {
    if (!socket) return;

    const onGuestJoined = (data: { nickname: string }) => {
      toast.success(`${data.nickname} joined!`);
    };

    const onSessionReady = () => {
      // Auto-navigate handled in store
    };

    const onHostDisconnected = () => {
      toast.error("Host disconnected");
    };

    socket.on("guest-joined", onGuestJoined);
    socket.on("session-ready", onSessionReady);
    socket.on("host-disconnected", onHostDisconnected);

    return () => {
      socket.off("guest-joined", onGuestJoined);
      socket.off("session-ready", onSessionReady);
      socket.off("host-disconnected", onHostDisconnected);
    };
  }, [socket]);

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

  const handleLeave = () => {
    reset();
    setScreen("landing");
  };

  if (!roomCode) {
    setScreen("landing");
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        {/* Back button */}
        <button
          onClick={handleLeave}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Leave
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <motion.img
            src="/assets/cookie-logo.png"
            alt=""
            className="w-20 h-20 mx-auto mb-4 image-pixelated"
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
          <h2 className="text-xl font-pixel text-foreground">
            {role === "host" ? "Waiting for Guest" : "Connecting to Room"}
          </h2>
        </div>

        {/* Room Code Card */}
        <div className="pixel-card p-6 space-y-6">
          {/* Room Code */}
          <div className="text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
              Room Code
            </p>
            <div className="flex items-center justify-center gap-3">
              <code className="text-3xl font-mono font-bold tracking-wider text-foreground bg-muted px-4 py-2 rounded-lg">
                {roomCode}
              </code>
              <button
                onClick={handleCopyCode}
                className="p-2 rounded-lg bg-muted hover:bg-primary/10 transition-colors"
                title="Copy room code"
              >
                {copied ? (
                  <Check className="w-5 h-5 text-emerald-500" />
                ) : (
                  <Copy className="w-5 h-5 text-muted-foreground" />
                )}
              </button>
            </div>
          </div>

          {/* Share hint */}
          {role === "host" && (
            <p className="text-center text-sm text-muted-foreground">
              Share this code with your partner to start watching together
            </p>
          )}

          {/* Connection Status */}
          <div className="space-y-3">
            {/* Host status */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <div className={`connection-dot ${role === "host" ? "connected" : partnerConnected ? "connected" : "disconnected"}`} />
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {role === "host" ? "You (Host)" : "Host"}
                  </span>
                </div>
              </div>
              <span className="text-xs text-emerald-500 font-medium flex items-center gap-1">
                <Wifi className="w-3 h-3" />
                Connected
              </span>
            </div>

            {/* Guest status */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <div className={`connection-dot ${partnerConnected ? "connected" : "disconnected"}`} />
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {role === "guest" ? "You (Guest)" : "Guest"}
                  </span>
                </div>
              </div>
              <AnimatePresence mode="wait">
                {partnerConnected ? (
                  <motion.span
                    key="connected"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-xs text-emerald-500 font-medium flex items-center gap-1"
                  >
                    <Wifi className="w-3 h-3" />
                    {partnerNickname || "Connected"}
                  </motion.span>
                ) : (
                  <motion.span
                    key="waiting"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-xs text-amber-500 font-medium flex items-center gap-1"
                  >
                    <WifiOff className="w-3 h-3" />
                    Waiting{dots}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Waiting animation */}
          {!partnerConnected && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-center py-4"
            >
              <div className="flex gap-2">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-3 h-3 rounded-full bg-[hsl(var(--cookie))]"
                    animate={{ y: [0, -8, 0] }}
                    transition={{
                      duration: 0.6,
                      repeat: Infinity,
                      delay: i * 0.15,
                    }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
