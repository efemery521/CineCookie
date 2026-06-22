import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

interface SessionTimerProps {
  startTime: number | null;
}

export function SessionTimer({ startTime }: SessionTimerProps) {
  const [elapsed, setElapsed] = useState("00:00");

  useEffect(() => {
    if (!startTime) return;

    const update = () => {
      const diff = Date.now() - startTime;
      const hours = Math.floor(diff / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);

      if (hours > 0) {
        setElapsed(
          `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
            .toString()
            .padStart(2, "0")}`
        );
      } else {
        setElapsed(
          `${minutes.toString().padStart(2, "0")}:${seconds
            .toString()
            .padStart(2, "0")}`
        );
      }
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  if (!startTime) return null;

  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
      <Clock className="w-3 h-3" />
      <span className="font-mono">{elapsed}</span>
    </div>
  );
}
