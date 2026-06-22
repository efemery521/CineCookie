import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useStore } from "@/store/useStore";
import { useSocket } from "@/hooks/useSocket";
import { Mic, MicOff, Volume2, VolumeX, X } from "lucide-react";
import { toast } from "sonner";

export function VoiceControls() {
  const { role, isVoiceEnabled, setIsVoiceEnabled, partnerConnected } = useStore();
  const { socket, sendWebRTCOffer, sendWebRTCAnswer, sendWebRTCIceCandidate } = useSocket();
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize WebRTC
  useEffect(() => {
    if (!isVoiceEnabled || !partnerConnected) return;

    const initWebRTC = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        localStreamRef.current = stream;

        const pc = new RTCPeerConnection({
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" },
          ],
        });
        peerConnectionRef.current = pc;

        // Add local tracks
        stream.getAudioTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });

        // Handle remote stream
        pc.ontrack = (event) => {
          const [remoteStream] = event.streams;
          if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = remoteStream;
          }
        };

        // Handle ICE candidates
        pc.onicecandidate = (event) => {
          if (event.candidate) {
            sendWebRTCIceCandidate(
              event.candidate.toJSON(),
              role === "host" ? "guest" : "host"
            );
          }
        };

        // Host initiates the connection
        if (role === "host") {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          sendWebRTCOffer(offer, "guest");
        }

        setIsConnected(true);
        toast.success("Voice chat connected!");
      } catch (err) {
        console.error("WebRTC error:", err);
        toast.error("Failed to start voice chat");
        setIsVoiceEnabled(false);
      }
    };

    initWebRTC();

    return () => {
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      peerConnectionRef.current?.close();
      setIsConnected(false);
    };
  }, [isVoiceEnabled, partnerConnected, role]);

  // Handle signaling messages
  useEffect(() => {
    if (!socket) return;

    const handleOffer = async (data: {
      offer: RTCSessionDescriptionInit;
      fromRole: "host" | "guest";
    }) => {
      if (!peerConnectionRef.current) return;
      await peerConnectionRef.current.setRemoteDescription(
        new RTCSessionDescription(data.offer)
      );
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);
      sendWebRTCAnswer(answer, data.fromRole);
    };

    const handleAnswer = (data: {
      answer: RTCSessionDescriptionInit;
      fromRole: "host" | "guest";
    }) => {
      if (!peerConnectionRef.current) return;
      peerConnectionRef.current.setRemoteDescription(
        new RTCSessionDescription(data.answer)
      );
    };

    const handleIceCandidate = (data: {
      candidate: RTCIceCandidateInit;
      fromRole: "host" | "guest";
    }) => {
      if (!peerConnectionRef.current) return;
      peerConnectionRef.current.addIceCandidate(
        new RTCIceCandidate(data.candidate)
      );
    };

    socket.on("webrtc-offer", handleOffer);
    socket.on("webrtc-answer", handleAnswer);
    socket.on("webrtc-ice-candidate", handleIceCandidate);

    return () => {
      socket.off("webrtc-offer", handleOffer);
      socket.off("webrtc-answer", handleAnswer);
      socket.off("webrtc-ice-candidate", handleIceCandidate);
    };
  }, [socket, sendWebRTCAnswer]);

  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = isMuted;
      });
    }
    setIsMuted(!isMuted);
  }, [isMuted]);

  const toggleDeafen = useCallback(() => {
    if (remoteAudioRef.current) {
      remoteAudioRef.current.muted = !isDeafened;
    }
    setIsDeafened(!isDeafened);
  }, [isDeafened]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-card/90 backdrop-blur-sm border border-border rounded-xl p-3 shadow-lg"
    >
      {/* Hidden audio element for remote stream */}
      <audio ref={remoteAudioRef} autoPlay />

      <div className="flex items-center gap-2">
        {/* Mute Button */}
        <button
          onClick={toggleMute}
          className={`p-2 rounded-lg transition-colors ${
            isMuted
              ? "bg-red-500/10 text-red-500"
              : "bg-emerald-500/10 text-emerald-500"
          }`}
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? (
            <MicOff className="w-4 h-4" />
          ) : (
            <Mic className="w-4 h-4" />
          )}
        </button>

        {/* Deafen Button */}
        <button
          onClick={toggleDeafen}
          className={`p-2 rounded-lg transition-colors ${
            isDeafened
              ? "bg-red-500/10 text-red-500"
              : "bg-primary/10 text-primary"
          }`}
          title={isDeafened ? "Undeafen" : "Deafen"}
        >
          {isDeafened ? (
            <VolumeX className="w-4 h-4" />
          ) : (
            <Volume2 className="w-4 h-4" />
          )}
        </button>

        {/* Status */}
        <div className="flex items-center gap-1.5 px-2">
          <div
            className={`w-2 h-2 rounded-full ${
              isConnected ? "bg-emerald-500" : "bg-amber-500"
            }`}
          />
          <span className="text-xs text-muted-foreground">
            {isConnected ? "Connected" : "Connecting..."}
          </span>
        </div>

        {/* Close */}
        <button
          onClick={() => setIsVoiceEnabled(false)}
          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground ml-2"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </motion.div>
  );
}
