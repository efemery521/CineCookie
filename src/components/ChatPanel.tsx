import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/store/useStore";
import { useSocket } from "@/hooks/useSocket";
import { Send, Smile, StickyNote, Trash2 } from "lucide-react";
import { toast } from "sonner";

const EMOJIS = ["❤️", "🍿", "😂", "😭", "😮", "👍", "🔥", "✨"];

export function ChatPanel() {
  const { messages, nickname, partnerTyping, addMessage, addReaction, notes, addNote: storeAddNote, deleteNote } =
    useStore();
  const { sendMessage: sendMessageSocket, sendTyping: sendTypingSocket, sendReaction: sendReactionSocket } = useSocket();
  const [input, setInput] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [noteInput, setNoteInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, partnerTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const content = input.trim();
    setInput("");

    const result = await sendMessageSocket(content);
    if (result.success && result.message) {
      addMessage(result.message);
    }
    sendTypingSocket(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);

    // Send typing indicator
    sendTypingSocket(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      sendTypingSocket(false);
    }, 2000);
  };

  const handleEmojiClick = (emoji: string) => {
    sendReactionSocket(emoji);
    addReaction({ emoji, sender: "me", timestamp: Date.now() });
    setShowEmoji(false);
  };

  const handleAddNote = () => {
    if (!noteInput.trim()) return;
    storeAddNote({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      content: noteInput.trim(),
      author: nickname || "You",
      timestamp: Date.now(),
      position: { x: Math.random() * 200, y: Math.random() * 200 },
    });
    setNoteInput("");
    toast.success("Note added!");
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="w-80 h-full flex flex-col bg-card">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="font-medium text-sm">Chat</h3>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowNotes(!showNotes)}
            className={`p-1.5 rounded-lg transition-colors ${
              showNotes
                ? "bg-primary/10 text-primary"
                : "hover:bg-muted text-muted-foreground"
            }`}
            title="Notes"
          >
            <StickyNote className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowEmoji(!showEmoji)}
            className={`p-1.5 rounded-lg transition-colors ${
              showEmoji
                ? "bg-primary/10 text-primary"
                : "hover:bg-muted text-muted-foreground"
            }`}
            title="Reactions"
          >
            <Smile className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Notes Panel */}
      <AnimatePresence>
        {showNotes && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="border-b border-border overflow-hidden"
          >
            <div className="p-3 space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  placeholder="Add a note..."
                  className="flex-1 text-xs pixel-input py-1.5 px-3"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddNote();
                  }}
                />
                <button
                  onClick={handleAddNote}
                  className="pixel-btn text-xs py-1.5 px-3"
                >
                  <Send className="w-3 h-3" />
                </button>
              </div>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {notes.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    No notes yet
                  </p>
                )}
                {notes.map((note) => (
                  <motion.div
                    key={note.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-start justify-between p-2 rounded-lg bg-yellow-100/50 dark:bg-yellow-900/20 text-xs"
                  >
                    <span className="flex-1">{note.content}</span>
                    <button
                      onClick={() => deleteNote(note.id)}
                      className="ml-2 text-muted-foreground hover:text-red-500"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Emoji Panel */}
      <AnimatePresence>
        {showEmoji && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="border-b border-border overflow-hidden"
          >
            <div className="p-3 flex flex-wrap gap-2">
              {EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleEmojiClick(emoji)}
                  className="text-xl p-1.5 rounded-lg hover:bg-muted transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <img
              src="/assets/popcorn-icon.png"
              alt=""
              className="w-12 h-12 image-pixelated opacity-30 mb-2"
            />
            <p className="text-xs">No messages yet</p>
            <p className="text-xs">Say something!</p>
          </div>
        )}

        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex flex-col ${
              msg.sender === nickname ? "items-end" : "items-start"
            }`}
          >
            <span className="text-[10px] text-muted-foreground mb-0.5">
              {msg.sender} · {formatTime(msg.timestamp)}
            </span>
            <div
              className={`chat-bubble text-xs ${
                msg.sender === nickname ? "chat-bubble-own" : "chat-bubble-other"
              }`}
            >
              {msg.content}
            </div>
          </motion.div>
        ))}

        {/* Typing indicator */}
        {partnerTyping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-1 text-muted-foreground text-xs"
          >
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-muted-foreground"
                  animate={{ y: [0, -4, 0] }}
                  transition={{
                    duration: 0.5,
                    repeat: Infinity,
                    delay: i * 0.1,
                  }}
                />
              ))}
            </div>
            <span>typing...</span>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-border">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder="Type a message..."
            className="flex-1 pixel-input text-xs py-2 px-3"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="pixel-btn py-2 px-3 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
