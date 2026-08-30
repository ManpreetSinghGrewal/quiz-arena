import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import AnimatedBackground from "@/components/AnimatedBackground";
import { Swords, Users, ArrowLeft, Loader2, Check } from "lucide-react";
import { useSocket } from "@/contexts/SocketContext";
import { useAuth } from "@/contexts/AuthContext";

const SEARCH_MESSAGES = [
  "Finding a worthy challenger...",
  "Contacting game server...",
  "Analyzing candidate pools...",
  "Preparing battle deck...",
  "Synchronizing match rooms...",
];

const Matchmaking = () => {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const { user } = useAuth();
  const [status, setStatus] = useState("idle");
  const [searchTime, setSearchTime] = useState(0);
  const [msgIndex, setMsgIndex] = useState(0);
  const [opponent, setOpponent] = useState(null);
  const [countdown, setCountdown] = useState(3);
  const matchDataRef = useRef(null);

  useEffect(() => {
    if (!socket) return;

    const handleMatchFound = (data) => {
      console.log("Match found event received:", data);
      matchDataRef.current = data;
      setOpponent(data.opponent);
      setStatus("found");
    };

    socket.on("matchmaking:found", handleMatchFound);

    return () => {
      socket.off("matchmaking:found", handleMatchFound);
    };
  }, [socket]);

  useEffect(() => {
    if (status !== "searching") return;
    setSearchTime(0);
    setMsgIndex(0);

    const timer = setInterval(() => setSearchTime((prev) => prev + 1), 1000);
    const msgTimer = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % SEARCH_MESSAGES.length);
    }, 3000);
    
    socket.emit("matchmaking:join", {
      name: user?.name || "Anonymous",
      level: 8,
      avatar: user?.avatar || 0
    });

    return () => {
      clearInterval(timer);
      clearInterval(msgTimer);
    };
  }, [status, socket, user]);

  useEffect(() => {
    if (status !== "found") return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setStatus("ready");
          // Navigate to quiz with match data
          navigate("/quiz/battle", { 
            state: { 
              isMultiplayer: true,
              matchData: matchDataRef.current
            } 
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [status, navigate]);

  const handleCancel = () => {
    if (socket) {
      socket.emit("matchmaking:cancel");
    }
    setStatus("idle");
    setSearchTime(0);
  };

  const startBotMatch = async () => {
    try {
      setStatus("loading_bot");
      if (socket) {
        socket.emit("matchmaking:cancel");
      }
      const apiBase = getApiBase();
      const randomSubject = ["Operating System", "Computer Networks", "Data Base Management System", "Data Structures and Algorithms"][Math.floor(Math.random() * 4)];
      
      const response = await fetch(`${apiBase}/api/auth/quiz-questions?subject=${encodeURIComponent(randomSubject)}&amount=10`);
      const data = await response.json();
      
      if (response.ok && data.questions) {
        const botMatchData = {
          roomId: "bot_match_" + Date.now(),
          subject: randomSubject,
          timePerQuestion: 20,
          questions: data.questions,
          isBot: true,
          opponent: {
            name: "TuringBot 🤖",
            level: 5,
            avatar: Math.floor(Math.random() * 12)
          }
        };
        
        matchDataRef.current = botMatchData;
        setOpponent(botMatchData.opponent);
        setCountdown(3);
        setStatus("found");
      } else {
        alert("Failed to initialize Practice Bot.");
        setStatus("idle");
      }
    } catch (err) {
      console.error(err);
      alert("Error initializing Practice Bot.");
      setStatus("idle");
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="page" style={{ display: "flex", flexDirection: "column" }}>
      <AnimatedBackground variant="particles" />

      <header className="matchmaking-header glass">
        <div className="container matchmaking-header-inner" style={{ height: "4rem", display: "flex", alignItems: "center", gap: "1rem" }}>
          <button className="btn btn-ghost btn-icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft style={{ width: "1.25rem", height: "1.25rem" }} />
          </button>
          <div>
            <p style={{ fontWeight: 700, color: "var(--foreground)" }}>Battle Mode</p>
            <p style={{ fontSize: "0.875rem", color: "var(--muted-foreground)" }}>Real-time Quiz Battle</p>
          </div>
        </div>
      </header>

      <main className="matchmaking-main">
        <div className="matchmaking-content">
          {status === "idle" && (
            <div className="animate-fade-in">
              <div className="matchmaking-icon animate-glow" style={{ boxShadow: "var(--shadow-glow-accent)" }}>
                <Swords />
              </div>
              <h2 className="matchmaking-title">Ready for Battle?</h2>
              <p className="matchmaking-subtitle">Challenge a random opponent to a real-time quiz duel!</p>
              <button className="btn btn-game btn-xl gradient-accent" onClick={() => setStatus("searching")}>
                <Users style={{ width: "1.25rem", height: "1.25rem" }} /> Find Opponent
              </button>
            </div>
          )}

          {status === "searching" && (
            <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              {/* Radar Sonar Pulse Animation */}
              <div style={{ 
                position: "relative", 
                width: "140px", 
                height: "140px", 
                margin: "0 auto 2rem", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center" 
              }}>
                <div className="animate-ping" style={{ position: "absolute", width: "100%", height: "100%", borderRadius: "50%", background: "rgba(234, 179, 8, 0.15)", animationDuration: "3s" }} />
                <div className="animate-ping" style={{ position: "absolute", width: "80%", height: "80%", borderRadius: "50%", background: "rgba(234, 179, 8, 0.2)", animationDuration: "2s" }} />
                <div style={{ 
                  zIndex: 10, 
                  width: "70px", 
                  height: "70px", 
                  borderRadius: "50%", 
                  background: "var(--accent)", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center", 
                  color: "var(--accent-foreground)",
                  boxShadow: "var(--shadow-glow-accent)"
                }}>
                  <Swords size={28} />
                </div>
              </div>
              
              <h2 className="matchmaking-title">Searching for Opponent...</h2>
              <p className="matchmaking-subtitle" style={{ minHeight: "1.5rem", color: "var(--muted-foreground)" }}>
                {SEARCH_MESSAGES[msgIndex]}
              </p>
              <p className="matchmaking-time" style={{ fontSize: "1.5rem", fontWeight: 750, marginTop: "1rem", color: "var(--primary)" }}>
                {formatTime(searchTime)}
              </p>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", width: "100%", alignItems: "center", marginTop: "2rem" }}>
                {searchTime >= 10 && (
                  <button 
                    className="btn btn-gradient animate-fade-in" 
                    style={{ width: "100%", maxWidth: "260px" }} 
                    onClick={startBotMatch}
                  >
                    🤖 Practice against Bot
                  </button>
                )}
                <button className="btn btn-outline" style={{ width: "100%", maxWidth: "260px" }} onClick={handleCancel}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {status === "loading_bot" && (
            <div className="animate-fade-in" style={{ padding: "3rem", textAlign: "center" }}>
              <Loader2 className="animate-spin" style={{ margin: "0 auto 1.5rem", width: "3.5rem", height: "3.5rem", color: "var(--primary)" }} />
              <h2 className="matchmaking-title">Deploying TuringBot 🤖...</h2>
              <p style={{ color: "var(--muted-foreground)" }}>Generating computer science questions and initializing sandbox battle arena...</p>
            </div>
          )}

          {(status === "found" || status === "ready") && opponent && (
            <div className="animate-scale-in">
              <h2 className="matchmaking-title" style={{ marginBottom: "2rem" }}>Opponent Found!</h2>

              <div className="vs-display">
                <div className="vs-player">
                  <div className="vs-avatar" style={{ background: "var(--primary)", color: "var(--primary-foreground)", border: "4px solid var(--primary)" }}>
                    {user?.name?.[0] || "U"}
                  </div>
                  <p className="vs-player-name">You</p>
                  <p className="vs-player-level">Level 8</p>
                </div>

                <div className="vs-badge gradient-accent">
                  <span>VS</span>
                </div>

                <div className="vs-player">
                  <div className="vs-avatar" style={{ background: "var(--game-battle)", color: "var(--accent-foreground)", border: "4px solid var(--game-battle)" }}>
                    {opponent.name[0]}
                  </div>
                  <p className="vs-player-name">{opponent.name}</p>
                  <p className="vs-player-level">Level {opponent.level}</p>
                </div>
              </div>

              <div style={{ marginBottom: "2rem" }}>
                <p style={{ color: "var(--muted-foreground)", marginBottom: "0.5rem" }}>Battle starts in</p>
                <div className="countdown-circle gradient-primary">
                  <span className="countdown-value">{countdown}</span>
                </div>
              </div>

              <div className="ready-status">
                <Check /> <span>Both players ready</span>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Matchmaking;
