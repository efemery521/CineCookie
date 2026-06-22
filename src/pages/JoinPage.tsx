import { useState } from "react";
import { motion } from "framer-motion";
import { useStore } from "@/store/useStore";
import { useSocket } from "@/hooks/useSocket";
import { ArrowLeft, Ticket, User, LogIn, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function JoinPage() {
  const { setScreen, setNickname, setRole, setRoomCode: setStoreRoomCode, setCurrentUrl, addMessage, nickname, recentRooms } = useStore();
  const { joinRoom } = useSocket();
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [name, setName] = useState(nickname || "");
  const [isLoading, setIsLoading] = useState(false);

  const handleJoinRoom = async () => {
    if (!roomCodeInput.trim()) {
      toast.error("Please enter a room code");
      return;
    }
    if (!name.trim()) {
      toast.error("Please enter your nickname");
      return;
    }

    setIsLoading(true);
    try {
      const result = await joinRoom(roomCodeInput.trim(), name.trim());
      if (result.success) {
        setNickname(name.trim());
        setRole("guest");
        setStoreRoomCode(roomCodeInput.trim().toUpperCase());
        setCurrentUrl(result.url || "");
        
        // Restore chat history
        if (result.messages) {
          result.messages.forEach((msg) => addMessage(msg));
        }
        
        toast.success("Joined room!");
      } else {
        toast.error(result.error || "Failed to join room");
      }
    } catch {
      toast.error("Connection failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickJoin = (code: string) => {
    setRoomCodeInput(code);
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
          <img src="/assets/ticket-icon.png" alt="" className="w-12 h-12 image-pixelated" />
          <div>
            <h2 className="text-2xl font-pixel text-foreground">Join Room</h2>
            <p className="text-sm text-muted-foreground">Enter a room code to connect</p>
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
            />
          </div>

          {/* Room Code Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Ticket className="w-4 h-4 text-[hsl(var(--cookie))]" />
              Room Code
            </label>
            <input
              type="text"
              value={roomCodeInput}
              onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
              placeholder="ABCD-1234"
              className="pixel-input w-full font-mono tracking-wider uppercase"
              maxLength={9}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleJoinRoom();
              }}
            />
            <p className="text-xs text-muted-foreground">
              Ask your host for the room code
            </p>
          </div>

          {/* Join Button */}
          <button
            onClick={handleJoinRoom}
            disabled={isLoading}
            className="pixel-btn w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Joining...
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                Join Session
              </>
            )}
          </button>
        </div>

        {/* Recent Rooms */}
        {recentRooms.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-6"
          >
            <p className="text-sm text-muted-foreground mb-3">Recent Rooms</p>
            <div className="flex flex-wrap gap-2">
              {recentRooms.map((code) => (
                <button
                  key={code}
                  onClick={() => handleQuickJoin(code)}
                  className="px-3 py-1.5 rounded-lg bg-muted text-sm font-mono hover:bg-primary/10 hover:text-primary transition-colors"
                >
                  {code}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
