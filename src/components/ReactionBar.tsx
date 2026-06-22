import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/store/useStore";

interface FloatingReaction {
  id: string;
  emoji: string;
  x: number;
  y: number;
  timestamp: number;
}

export function ReactionBar() {
  const { reactions } = useStore();
  const [floatingReactions, setFloatingReactions] = useState<FloatingReaction[]>([]);

  // Show floating reactions when new ones arrive
  useEffect(() => {
    if (reactions.length === 0) return;
    const latest = reactions[reactions.length - 1];
    if (Date.now() - latest.timestamp < 100) {
      const newReaction: FloatingReaction = {
        id: `${Date.now()}-${Math.random()}`,
        emoji: latest.emoji,
        x: 20 + Math.random() * 60,
        y: 70 + Math.random() * 20,
        timestamp: Date.now(),
      };
      setFloatingReactions((prev) => [...prev, newReaction]);

      // Remove after animation
      setTimeout(() => {
        setFloatingReactions((prev) => prev.filter((r) => r.id !== newReaction.id));
      }, 2500);
    }
  }, [reactions.length]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <AnimatePresence>
        {floatingReactions.map((reaction) => (
          <motion.div
            key={reaction.id}
            initial={{
              opacity: 1,
              y: 0,
              scale: 0.5,
              left: `${reaction.x}%`,
              top: `${reaction.y}%`,
            }}
            animate={{
              opacity: 0,
              y: -150,
              scale: 1.5,
              left: `${reaction.x + (Math.random() - 0.5) * 20}%`,
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2.5, ease: "easeOut" }}
            className="absolute text-4xl"
            style={{ pointerEvents: "none" }}
          >
            {reaction.emoji}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
