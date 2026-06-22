import { motion } from "framer-motion";
import { useStore } from "@/store/useStore";
import { Monitor, LogIn, Sparkles } from "lucide-react";

export function LandingPage() {
  const setScreen = useStore((s) => s.setScreen);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      {/* Floating background decorations */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.img
          src="/assets/popcorn-icon.png"
          alt=""
          className="absolute w-16 h-16 image-pixelated opacity-20"
          style={{ top: "10%", left: "10%" }}
          animate={{ y: [0, -15, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.img
          src="/assets/ticket-icon.png"
          alt=""
          className="absolute w-20 h-20 image-pixelated opacity-15"
          style={{ top: "20%", right: "15%" }}
          animate={{ y: [0, -12, 0], rotate: [0, -5, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
        <motion.img
          src="/assets/clapper-icon.png"
          alt=""
          className="absolute w-14 h-14 image-pixelated opacity-15"
          style={{ bottom: "25%", left: "8%" }}
          animate={{ y: [0, -10, 0], rotate: [0, 3, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        />
        <motion.img
          src="/assets/monitor-icon.png"
          alt=""
          className="absolute w-16 h-16 image-pixelated opacity-15"
          style={{ bottom: "15%", right: "10%" }}
          animate={{ y: [0, -18, 0], rotate: [0, -3, 0] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
      </div>

      {/* Hero Scene Background */}
      <div className="absolute inset-0 z-0">
        <img
          src="/assets/hero-scene.png"
          alt=""
          className="w-full h-full object-cover opacity-10 dark:opacity-5 image-pixelated"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-8 px-4 max-w-lg w-full">
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, type: "spring" }}
          className="flex flex-col items-center gap-4"
        >
          <motion.img
            src="/assets/cookie-logo.png"
            alt="CineCookie"
            className="w-32 h-32 image-pixelated drop-shadow-lg"
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-pixel tracking-tight text-foreground text-shadow-pixel">
              Cine<span className="text-[hsl(var(--cookie))]">Cookie</span>
            </h1>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-3 text-muted-foreground text-sm md:text-base font-medium flex items-center gap-2 justify-center"
            >
              <Sparkles className="w-4 h-4 text-[hsl(var(--cookie))]" />
              Watch Together. Stay Together.
              <Sparkles className="w-4 h-4 text-[hsl(var(--cookie))]" />
            </motion.p>
          </div>
        </motion.div>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-muted-foreground text-sm max-w-sm"
        >
          A cozy watch-party platform for couples and close friends. 
          Synchronize your movie nights in real-time.
        </motion.p>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col gap-3 w-full max-w-xs"
        >
          <button
            onClick={() => setScreen("host")}
            className="pixel-btn w-full text-sm"
          >
            <Monitor className="w-4 h-4" />
            Host Room
          </button>
          <button
            onClick={() => setScreen("join")}
            className="pixel-btn-secondary w-full text-sm"
          >
            <LogIn className="w-4 h-4" />
            Join Room
          </button>
        </motion.div>

        {/* Pixel Art Icons Row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="flex items-center gap-4 mt-4"
        >
          <img src="/assets/popcorn-icon.png" alt="" className="w-10 h-10 image-pixelated opacity-60" />
          <img src="/assets/ticket-icon.png" alt="" className="w-12 h-12 image-pixelated opacity-60" />
          <img src="/assets/clapper-icon.png" alt="" className="w-10 h-10 image-pixelated opacity-60" />
        </motion.div>
      </div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-4 text-xs text-muted-foreground/60"
      >
        Made with ♥ for cozy movie nights
      </motion.div>
    </div>
  );
}
