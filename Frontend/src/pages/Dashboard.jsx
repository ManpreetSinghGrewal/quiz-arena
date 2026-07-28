import { useEffect, useState } from "react";
import Header from "@/components/Header";
import GameModeCard from "@/components/GameModeCard";
import StatsCard from "@/components/StatsCard";
import LeaderboardItem from "@/components/LeaderboardItem";
import AnimatedBackground from "@/components/AnimatedBackground";
import { BookOpen, Calendar, Swords, Zap, Trophy, Target, Flame, Award } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSocket } from "@/contexts/SocketContext";
import { getApiBase } from "@/lib/utils";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket, onlineCount } = useSocket();
  const [topPlayers, setTopPlayers] = useState([]);
  const [loadingPlayers, setLoadingPlayers] = useState(true);
  const [profileStats, setProfileStats] = useState({
    totalScore: 0,
    totalQuizzes: 0,
    currentStreak: 0,
    accuracy: 0,
  });
  const [recentQuizzes, setRecentQuizzes] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [globalActivity, setGlobalActivity] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    fetchTopPlayers();
    fetchProfileStats(token);
    fetchRecentHistory(token);
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on("stats:updated", (newStats) => {
      console.log("Live Stats Update:", newStats);
      setProfileStats(newStats);
      const token = localStorage.getItem("token");
      if (token) fetchRecentHistory(token);
    });

    socket.on("leaderboard:updated", () => {
      console.log("Live Leaderboard Update");
      fetchTopPlayers();
    });

    socket.on("activity:new", (activity) => {
      console.log("New Global Activity:", activity);
      setGlobalActivity(prev => [activity, ...prev].slice(0, 5));
    });

    return () => {
      socket.off("stats:updated");
      socket.off("leaderboard:updated");
      socket.off("activity:new");
    };
  }, [socket]);



  const fetchTopPlayers = async () => {
    try {
      setLoadingPlayers(true);
      const apiBase = getApiBase();
      const response = await fetch(`${apiBase}/api/auth/leaderboard?limit=5`);
      const data = await response.json();
      setTopPlayers(data);
    } catch (error) {
      console.error("Failed to fetch top players:", error);
      setTopPlayers([]);
    } finally {
      setLoadingPlayers(false);
    }
  };

  const fetchProfileStats = async (token) => {
    try {
      const apiBase = getApiBase();
      const response = await fetch(`${apiBase}/api/auth/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (!response.ok) return;
      setProfileStats({
        totalScore: data.totalScore || 0,
        totalQuizzes: data.totalQuizzes || 0,
        currentStreak: data.currentStreak || 0,
        accuracy: data.accuracy || 0,
      });
    } catch (error) {
      console.error("Failed to fetch profile stats:", error);
    }
  };

  const fetchRecentHistory = async (token) => {
    try {
      setLoadingHistory(true);
      const apiBase = getApiBase();
      const response = await fetch(`${apiBase}/api/auth/quiz-history`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setRecentQuizzes(data.slice(0, 3));
      }
    } catch (error) {
      console.error("Failed to fetch recent history:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const stats = [
    { label: "Total Score", value: profileStats.totalScore.toLocaleString(), icon: Trophy },
    { label: "Quizzes Played", value: String(profileStats.totalQuizzes), icon: Target },
    { label: "Current Streak", value: `${profileStats.currentStreak} day${profileStats.currentStreak === 1 ? "" : "s"}`, icon: Flame },
    { label: "Win Rate", value: `${profileStats.accuracy}%`, icon: Award },
  ];

  const gameModes = [
    { title: "Normal Quiz", description: "Classic quiz with Beginner, Intermediate, and Advanced levels. Perfect for practice!", icon: BookOpen, variant: "normal", path: "/quiz/normal" },
    { title: "Daily Challenge", description: "One attempt per day. Test your knowledge and compete for the daily crown!", icon: Calendar, variant: "daily", badge: "NEW", path: "/quiz/daily" },
    { title: "Battle Mode", description: "Real-time multiplayer quiz battles. Challenge friends or random opponents!", icon: Swords, variant: "battle", path: "/matchmaking" },
    { title: "Speed Quiz", description: "Race against the clock! Answer as many questions as you can before time runs out.", icon: Zap, variant: "speed", path: "/quiz/speed" },
  ];

  const displayName = user?.name?.split(" ")[0] || "Player";

  return (
    <div className="page">
      <AnimatedBackground variant="mesh" />
      <Header />

      <main className="container" style={{ paddingTop: "2rem", paddingBottom: "2rem" }}>
        <div className="dashboard-welcome animate-fade-in" style={{ marginBottom: "2rem" }}>
          <h1>Welcome back, {displayName}! 👋</h1>
          <p>Ready to test your knowledge today?</p>
        </div>

        <div className="stats-grid">
          {stats.map((stat, index) => (
            <div key={stat.label} className="animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
              <StatsCard {...stat} />
            </div>
          ))}
        </div>

        <div className="dashboard-main">
          <div>
            <h2 className="section-heading">Game Modes</h2>
            <div className="game-modes-grid">
              {gameModes.map((mode, index) => (
                <div key={mode.title} className="animate-fade-in" style={{ animationDelay: `${(index + 4) * 50}ms` }}>
                  <GameModeCard {...mode} onClick={() => navigate(mode.path)} />
                </div>
              ))}
            </div>

            <div style={{ marginTop: "2.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <h2 className="section-heading" style={{ marginBottom: 0 }}>Recent Activity</h2>
                <button onClick={() => navigate("/profile")} className="view-all-link">See Profile</button>
              </div>
              <div className="card glow-border" style={{ padding: "1.25rem" }}>
                {loadingHistory ? (
                  <p style={{ textAlign: "center", color: "var(--muted-foreground)" }}>Loading activity...</p>
                ) : recentQuizzes.length === 0 ? (
                  <p style={{ textAlign: "center", color: "var(--muted-foreground)", padding: "1rem" }}>No quizzes played yet.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {recentQuizzes.map((quiz, idx) => (
                      <div key={quiz._id} style={{ 
                        display: "flex", 
                        justifyContent: "space-between", 
                        alignItems: "center",
                        padding: "0.75rem",
                        background: "var(--secondary)",
                        borderRadius: "var(--radius)",
                        border: "1px solid var(--border)"
                      }}>
                        <div>
                          <p style={{ fontWeight: 600 }}>{quiz.subject} Quiz</p>
                          <p style={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>
                            {new Date(quiz.createdAt).toLocaleDateString()} • {quiz.score} pts
                          </p>
                        </div>
                        <div style={{ 
                          width: "2.5rem", 
                          height: "2.5rem", 
                          borderRadius: "50%", 
                          background: "var(--primary-foreground)", 
                          color: "var(--primary)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 700,
                          fontSize: "0.8rem"
                        }}>
                          {Math.round((quiz.correctAnswers / quiz.totalQuestions) * 100)}%
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="leaderboard-sidebar animate-fade-in" style={{ animationDelay: "400ms" }}>
            {globalActivity.length > 0 && (
              <div style={{ marginBottom: "2rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <h2 className="section-heading" style={{ marginBottom: 0 }}>Global Activity</h2>
                  <span className="badge badge-primary" style={{ fontSize: "0.6rem", padding: "0.2rem 0.5rem" }}>LIVE</span>
                </div>
                <div className="card glow-border" style={{ padding: "0.75rem", background: "rgba(var(--primary-rgb), 0.03)" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {globalActivity.map((activity, idx) => (
                      <div key={idx} className="animate-slide-in" style={{ 
                        fontSize: "0.85rem", 
                        display: "flex", 
                        alignItems: "center", 
                        gap: "0.75rem",
                        padding: "0.5rem",
                        borderBottom: idx < globalActivity.length - 1 ? "1px solid var(--border)" : "none"
                      }}>
                        <div style={{ 
                          width: "2rem", 
                          height: "2rem", 
                          borderRadius: "50%", 
                          background: "var(--primary)", 
                          color: "white",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0
                        }}>
                          <Zap size={12} />
                        </div>
                        <div>
                          <p style={{ margin: 0 }}>
                            <span style={{ fontWeight: 600 }}>{activity.userName}</span> finished 
                            <span style={{ color: "var(--primary)", fontWeight: 500 }}> {activity.subject}</span>
                          </p>
                          <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--muted-foreground)" }}>
                            Scored {activity.score} pts • Just now
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="leaderboard-sidebar-header">

              <h2 className="section-heading" style={{ marginBottom: 0 }}>Top Players</h2>
              <button onClick={() => navigate("/leaderboard")} className="view-all-link">View all</button>
            </div>
            <div className="card glow-border" style={{ padding: "1rem" }}>
              {loadingPlayers ? (
                <div style={{ textAlign: "center", padding: "1rem", color: "var(--muted-foreground)" }}>
                  <p>Loading...</p>
                </div>
              ) : topPlayers.length === 0 ? (
                <div style={{ textAlign: "center", padding: "1rem", color: "var(--muted-foreground)" }}>
                  <p>No players yet</p>
                </div>
              ) : (
                topPlayers.map((player) => (
                  <LeaderboardItem key={player.rank} {...player} />
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
