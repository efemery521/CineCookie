import { useState } from "react";
import { motion } from "framer-motion";
import { useStore } from "@/store/useStore";
import { useSocket } from "@/hooks/useSocket";
import { ArrowLeft, Link2, User, Play, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function HostPage() {
  const { setScreen, setNickname, setRole, setRoomCode, setCurrentUrl, nickname } = useStore();
  const { createRoom } = useSocket();
  const [url, setUrl] = useState("");
  const [name, setName] = useState(nickname || "");
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateRoom = async () => {
    if (!url.trim()) {
      toast.error("Please enter a URL");
      return;
    }
    if (!name.trim()) {
      toast.error("Please enter your nickname");
      return;
    }

    // Validate URL
    let finalUrl = url.trim();
    if (!finalUrl.startsWith("http://") && !finalUrl.startsWith("https://")) {
      finalUrl = "https://" + finalUrl;
    }

    setIsLoading(true);
    try {
      const result = await createRoom(finalUrl, name.trim());
      if (result.success && result.roomCode) {
        setNickname(name.trim());
        setRole("host");
        setRoomCode(result.roomCode);
        setCurrentUrl(finalUrl);
        setScreen("lobby");
        toast.success("Room created!");
      } else {
        toast.error(result.error || "Failed to create room");
      }
    } catch {
      toast.error("Connection failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Back button */}
        <button
          onClick={() => setScreen("landing")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <img src="/assets/monitor-icon.png" alt="" className="w-12 h-12 image-pixelated" />
          <div>
            <h2 className="text-2xl font-pixel text-foreground">Host Room</h2>
            <p className="text-sm text-muted-foreground">Create a cozy watch session</p>
          </div>
        </div>

        {/* Form */}
        <div className="pixel-card p-6 space-y-5">
          {/* Nickname Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <User className="w-4 h-4 text-[hsl(var(--cookie))]" />
              Your Nickname
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name..."
              className="pixel-input w-full"
              maxLength={20}
              onKeyDown={(e) => {
                if (e.key === "Enter" && url) handleCreateRoom();
              }}
            />
          </div>

          {/* URL Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Link2 className="w-4 h-4 text-[hsl(var(--cookie))]" />
              Content URL
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/video"
              className="pixel-input w-full"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateRoom();
              }}
            />
            <p className="text-xs text-muted-foreground">
              Enter any URL to share with your partner
            </p>
          </div>

          {/* Start Button */}
          <button
            onClick={handleCreateRoom}
            disabled={isLoading}
            className="pixel-btn w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating Room...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Start Session
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
