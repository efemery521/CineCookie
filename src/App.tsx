import { AnimatePresence, motion } from "framer-motion";
import { useStore } from "@/store/useStore";
import { LandingPage } from "@/pages/LandingPage";
import { HostPage } from "@/pages/HostPage";
import { JoinPage } from "@/pages/JoinPage";
import { LobbyPage } from "@/pages/LobbyPage";
import { SessionPage } from "@/pages/SessionPage";
import { useSocket } from "@/hooks/useSocket";
import { Toaster } from "sonner";

function App() {
  const screen = useStore((s) => s.screen);
  useSocket(); // Initialize socket connection

  const renderScreen = () => {
    switch (screen) {
      case "landing":
        return <LandingPage />;
      case "host":
        return <HostPage />;
      case "join":
        return <JoinPage />;
      case "lobby":
        return <LobbyPage />;
      case "session":
        return <SessionPage />;
      default:
        return <LandingPage />;
    }
  };

  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div
          key={screen}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="min-h-screen bg-background text-foreground"
        >
          {renderScreen()}
        </motion.div>
      </AnimatePresence>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: "hsl(var(--card))",
            color: "hsl(var(--card-foreground))",
            border: "1px solid hsl(var(--border))",
          },
        }}
      />
    </>
  );
}

export default App;
