import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import AnimatedBackground from "@/components/AnimatedBackground";
import { useAuth } from "@/contexts/AuthContext";
import { getApiBase } from "@/lib/utils";
import {
  User, Mail, Lock, Trophy, Target, Flame, Award, LogOut,
  Check, X, Eye, EyeOff, Calendar, TrendingUp, Zap, Star, RefreshCw
} from "lucide-react";


const AVATARS = [
  { id: 0, emoji: "🧠", bg: "hsl(250, 90%, 65%)" },
  { id: 1, emoji: "🦊", bg: "hsl(20, 90%, 55%)" },
  { id: 2, emoji: "🐉", bg: "hsl(160, 80%, 45%)" },
  { id: 3, emoji: "🦅", bg: "hsl(200, 80%, 50%)" },
  { id: 4, emoji: "🐺", bg: "hsl(230, 50%, 50%)" },
  { id: 5, emoji: "🦁", bg: "hsl(45, 95%, 55%)" },
  { id: 6, emoji: "🐙", bg: "hsl(340, 85%, 60%)" },
  { id: 7, emoji: "🦄", bg: "hsl(280, 85%, 65%)" },
  { id: 8, emoji: "🐲", bg: "hsl(0, 70%, 50%)" },
  { id: 9, emoji: "🎯", bg: "hsl(180, 70%, 50%)" },
  { id: 10, emoji: "⚡", bg: "hsl(50, 90%, 50%)" },
  { id: 11, emoji: "🔥", bg: "hsl(15, 90%, 55%)" },
];

const Profile = () => {
  const navigate = useNavigate();
  const { logout, updateUser } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState("");
  const [activeTab, setActiveTab] = useState("stats");
  const [selectingAvatar, setSelectingAvatar] = useState(false);
  const [quizHistory, setQuizHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState(null);

  // 🔐 Fetch Profile from Backend
  const fetchProfile = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setRefreshing(true);
      const apiBase = getApiBase();
      const res = await fetch(`${apiBase}/api/auth/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        navigate("/login");
        return;
      }

      setProfile({
        full_name: data.name,
        email: data.email,
        avatar_index: data.avatar || 0,
        created_at: data.createdAt,
        totalScore: data.totalScore || 0,
        prevTotalScore: data.prevTotalScore || 0,
        totalQuizzes: data.totalQuizzes || 0,
        totalQuestions: data.totalQuestions || 0,
        correctAnswers: data.correctAnswers || 0,
        accuracy: data.accuracy || 0,
        prevAccuracy: data.prevAccuracy || 0,
        currentStreak: data.currentStreak || 0,
      });

      setNewName(data.name);
    } catch (err) {
      console.error("Error fetching profile. Check if VITE_API_URL is set correctly in Vercel. Error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchQuizHistory = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      setLoadingHistory(true);
      const apiBase = getApiBase();
      const res = await fetch(`${apiBase}/api/auth/quiz-history`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        setQuizHistory(data);
      }
    } catch (err) {
      console.error("Error fetching quiz history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchQuizHistory();
  }, [navigate]);

  const updateName = async () => {
    const token = localStorage.getItem("token");
    if (!newName.trim()) return;

    try {
      const apiBase = getApiBase();
      const res = await fetch(`${apiBase}/api/auth/update-name`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newName.trim() }),
      });

      const data = await res.json();

      if (res.ok) {
        setProfile((p) => ({ ...p, full_name: newName.trim() }));
        updateUser({ name: newName.trim() });
        setEditingName(false);
      } else {
        alert(data.message || "Error updating name");
      }
    } catch (err) {
      console.error("Error updating name:", err);
    }
  };

  const handleChangePassword = async () => {
    const token = localStorage.getItem("token");

    if (newPassword.length < 8) {
      setPasswordMsg("❌ Password must be at least 8 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMsg("❌ Passwords do not match");
      return;
    }

    try {
      const apiBase = getApiBase();
      const res = await fetch(`${apiBase}/api/auth/change-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ password: newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setPasswordMsg(`❌ ${data.message}`);
      } else {
        setPasswordMsg("✓ Password updated successfully!");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => {
          setPasswordMsg("");
          setChangingPassword(false);
        }, 2000);
      }
    } catch (err) {
      setPasswordMsg("❌ Error updating password");
    }
  };

  const signOut = () => {
    logout();
    navigate("/login");
  };

  const updateAvatar = async (avatarIndex) => {
    const token = localStorage.getItem("token");
    try {
      const apiBase = getApiBase();
      const res = await fetch(`${apiBase}/api/auth/update-profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ avatar: avatarIndex }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Error updating avatar");
        return;
      }
      setProfile((prev) => ({ ...prev, avatar_index: avatarIndex }));
      updateUser({ avatar: avatarIndex });
      setSelectingAvatar(false);
    } catch (error) {
      console.error("Error updating avatar:", error);
      alert("Error updating avatar");
    }
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", { 
      year: "numeric", 
      month: "short", 
      day: "numeric" 
    });
  };

  if (loading) {
    return (
      <div className="page">
        <AnimatedBackground variant="mesh" />
        <Header />
        <main className="container" style={{ paddingTop: "4rem", textAlign: "center" }}>
          <div className="animate-spin" style={{ fontSize: "2rem", display: "inline-block" }}>⚡</div>
          <p style={{ marginTop: "1rem", color: "var(--muted-foreground)" }}>Loading your profile...</p>
        </main>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="page">
        <AnimatedBackground variant="mesh" />
        <Header />
        <main className="container" style={{ paddingTop: "4rem", textAlign: "center" }}>
          <div style={{ color: "var(--destructive)", marginBottom: "1rem" }}>⚠️</div>
          <h2 style={{ marginBottom: "1rem" }}>Session Expired</h2>
          <button className="btn btn-primary" onClick={() => navigate("/login")}>
            Return to Login
          </button>
        </main>
      </div>
    );
  }

  const currentAvatar = AVATARS[profile.avatar_index] || AVATARS[0];
  const winRate = profile.totalQuestions > 0
    ? Math.round((profile.correctAnswers / profile.totalQuestions) * 100)
    : 0;
  const avgScore = profile.totalQuizzes > 0 
    ? Math.round(profile.totalScore / profile.totalQuizzes)
    : 0;

  return (
    <div className="page">
      <AnimatedBackground variant="mesh" />
      <Header />

      <main className="container" style={{ paddingTop: "2rem", paddingBottom: "3rem" }}>
        {/* Profile Header */}
        <div className="profile-header card glow-border animate-fade-in" style={{ padding: "2.5rem", marginBottom: "2rem" }}>
          <div className="profile-header-inner">
            <div className="profile-avatar-section" style={{ position: "relative" }}>
              <div
                className="profile-avatar"
                style={{ background: currentAvatar.bg, width: "6rem", height: "6rem", cursor: "pointer" }}
                onClick={() => setSelectingAvatar((prev) => !prev)}
                title="Change avatar"
              >
                <span style={{ fontSize: "3rem" }}>{currentAvatar.emoji}</span>
              </div>
              {selectingAvatar && (
                <div
                  className="card glass glow-border animate-fade-in"
                  style={{
                    position: "absolute",
                    top: "7.5rem",
                    left: "50%",
                    transform: "translateX(-50%)",
                    padding: "1.25rem",
                    zIndex: 100,
                    width: "20rem",
                    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5)",
                    backdropFilter: "blur(12px)",
                    border: "1px solid var(--primary)",
                  }}
                >
                  <p style={{ marginBottom: "0.5rem", fontSize: "0.875rem", fontWeight: 600 }}>Select Avatar</p>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.5rem" }}>
                    {AVATARS.map((avatar) => (
                      <button
                        key={avatar.id}
                        type="button"
                        className="avatar"
                        style={{
                          background: avatar.bg,
                          width: "2.5rem",
                          height: "2.5rem",
                          border: profile.avatar_index === avatar.id ? "2px solid var(--foreground)" : "2px solid transparent",
                        }}
                        onClick={() => updateAvatar(avatar.id)}
                      >
                        {avatar.emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="profile-info" style={{ flex: 1 }}>
              {editingName ? (
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
                  <input
                    className="input"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    style={{ height: "2.5rem", fontSize: "1.5rem", fontWeight: 700 }}
                    autoFocus
                  />
                  <button className="btn btn-primary btn-sm" onClick={updateName}><Check size={18} /></button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setEditingName(false)}><X size={18} /></button>
                </div>
              ) : (
                <h1 
                  style={{ fontSize: "2rem", fontWeight: 700, cursor: "pointer", marginBottom: "0.5rem" }}
                  onClick={() => setEditingName(true)}
                  title="Click to edit"
                >
                  {profile.full_name} ✏️
                </h1>
              )}

              <div style={{ display: "flex", alignItems: "center", gap: "2rem", flexWrap: "wrap", color: "var(--muted-foreground)", fontSize: "0.9rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Mail size={16} /> {profile.email}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Calendar size={16} /> Joined {formatDate(profile.created_at)}
                </div>
              </div>
            </div>

            <button
              onClick={() => fetchProfile()}
              disabled={refreshing}
              className="btn btn-ghost"
              style={{ alignSelf: "flex-start" }}
              title="Refresh stats"
            >
              <RefreshCw size={20} style={{ animation: refreshing ? "spin 1s linear infinite" : "none" }} />
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1.25rem" }}>🎮 Performance Stats</h2>
          <div className="stats-grid">
            <div className="card glow-border animate-fade-in" style={{ padding: "1.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                <span style={{ color: "var(--muted-foreground)" }}>Total Score</span>
                <Trophy size={20} style={{ color: "var(--warning)" }} />
              </div>
              <h3 style={{ fontSize: "2.5rem", fontWeight: 700, color: "var(--warning)" }}>{profile.totalScore.toLocaleString()}</h3>
              <p style={{ fontSize: "0.875rem", color: "var(--muted-foreground)", marginTop: "0.5rem" }}>Total points earned</p>
            </div>

            <div className="card glow-border animate-fade-in" style={{ padding: "1.5rem", animationDelay: "50ms" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                <span style={{ color: "var(--muted-foreground)" }}>Quizzes Played</span>
                <Target size={20} style={{ color: "var(--primary)" }} />
              </div>
              <h3 style={{ fontSize: "2.5rem", fontWeight: 700, color: "var(--primary)" }}>{profile.totalQuizzes}</h3>
              <p style={{ fontSize: "0.875rem", color: "var(--muted-foreground)", marginTop: "0.5rem" }}>Total attempts</p>
            </div>

            <div className="card glow-border animate-fade-in" style={{ padding: "1.5rem", animationDelay: "100ms" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                <span style={{ color: "var(--muted-foreground)" }}>Win Rate</span>
                <TrendingUp size={20} style={{ color: "var(--success)" }} />
              </div>
              <h3 style={{ fontSize: "2.5rem", fontWeight: 700, color: "var(--success)" }}>{winRate}%</h3>
              <p style={{ fontSize: "0.875rem", color: "var(--muted-foreground)", marginTop: "0.5rem" }}>Accuracy rate</p>
            </div>

            <div className="card glow-border animate-fade-in" style={{ padding: "1.5rem", animationDelay: "150ms" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                <span style={{ color: "var(--muted-foreground)" }}>Correct Answers</span>
                <Star size={20} style={{ color: "var(--accent)" }} />
              </div>
              <h3 style={{ fontSize: "2.5rem", fontWeight: 700, color: "var(--accent)" }}>{profile.correctAnswers}</h3>
              <p style={{ fontSize: "0.875rem", color: "var(--muted-foreground)", marginTop: "0.5rem" }}>Out of {profile.totalQuestions}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="profile-tabs" style={{ marginBottom: "2rem" }}>
          <button
            className={`profile-tab ${activeTab === "stats" ? "active" : ""}`}
            onClick={() => setActiveTab("stats")}
          >
            <TrendingUp size={16} /> Statistics
          </button>
          <button
            className={`profile-tab ${activeTab === "achievements" ? "active" : ""}`}
            onClick={() => setActiveTab("achievements")}
          >
            <Award size={16} /> Achievements
          </button>
          <button
            className={`profile-tab ${activeTab === "history" ? "active" : ""}`}
            onClick={() => setActiveTab("history")}
          >
            <Calendar size={16} /> Quiz History
          </button>
          <button
            className={`profile-tab ${activeTab === "security" ? "active" : ""}`}
            onClick={() => setActiveTab("security")}
          >
            <Lock size={16} /> Security
          </button>
        </div>

        {/* Tab Content */}
        <div className="card glow-border animate-fade-in" style={{ padding: "2rem", marginBottom: "2rem" }}>
          {activeTab === "stats" ? (
            <div>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1.5rem" }}>📊 Your Statistics</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1.5rem" }}>
                <div style={{ padding: "1.5rem", background: "var(--secondary)", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                    <Trophy size={18} style={{ color: "var(--warning)" }} />
                    <p style={{ color: "var(--muted-foreground)", fontSize: "0.875rem" }}>Average Score</p>
                  </div>
                  <h4 style={{ fontSize: "2rem", fontWeight: 700, color: "var(--warning)" }}>
                    {avgScore}
                  </h4>
                </div>
                <div style={{ padding: "1.5rem", background: "var(--secondary)", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                    <Calendar size={18} style={{ color: "var(--primary)" }} />
                    <p style={{ color: "var(--muted-foreground)", fontSize: "0.875rem" }}>Member Since</p>
                  </div>
                  <h4 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--primary)" }}>
                    {formatDate(profile.created_at)}
                  </h4>
                </div>
                <div style={{ padding: "1.5rem", background: "var(--secondary)", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                    <Flame size={18} style={{ color: "var(--accent)" }} />
                    <p style={{ color: "var(--muted-foreground)", fontSize: "0.875rem" }}>Current Streak</p>
                  </div>
                  <h4 style={{ fontSize: "2rem", fontWeight: 700, color: "var(--accent)" }}>
                    {profile.currentStreak} {profile.currentStreak === 1 ? "day" : "days"}
                  </h4>
                  <p style={{ fontSize: "0.75rem", color: "var(--muted-foreground)", marginTop: "0.5rem" }}>Keep daily practice to increase streak</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div style={{ marginTop: "2rem" }}>
                <h4 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem" }}>Accuracy Trend</h4>
                <div style={{ padding: "1rem", background: "var(--secondary)", borderRadius: "var(--radius)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                    <span style={{ fontSize: "0.875rem" }}>Current Accuracy</span>
                    <span style={{ fontSize: "1rem", fontWeight: 700, color: "var(--success)" }}>{profile.accuracy}%</span>
                  </div>
                  <div style={{ height: "8px", background: "var(--input)", borderRadius: "4px", overflow: "hidden" }}>
                    <div 
                      style={{ 
                        height: "100%", 
                        background: "var(--gradient-success)",
                        width: `${profile.accuracy}%`,
                        transition: "width 0.5s ease"
                      }} 
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === "achievements" ? (
            <div>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1.5rem" }}>🏆 Achievements</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "1rem" }}>
                <div style={{ padding: "1.5rem", background: "var(--secondary)", borderRadius: "var(--radius)", textAlign: "center", opacity: profile.totalQuizzes >= 1 ? 1 : 0.4 }}>
                  <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>📝</div>
                  <p style={{ fontSize: "0.875rem", fontWeight: 600 }}>First Quiz</p>
                  <p style={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>Complete 1 quiz</p>
                </div>
                <div style={{ padding: "1.5rem", background: "var(--secondary)", borderRadius: "var(--radius)", textAlign: "center", opacity: profile.totalQuizzes >= 5 ? 1 : 0.4 }}>
                  <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>⚡</div>
                  <p style={{ fontSize: "0.875rem", fontWeight: 600 }}>Quiz Starter</p>
                  <p style={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>Complete 5 quizzes</p>
                </div>
                <div style={{ padding: "1.5rem", background: "var(--secondary)", borderRadius: "var(--radius)", textAlign: "center", opacity: profile.totalQuizzes >= 10 ? 1 : 0.4 }}>
                  <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>🚀</div>
                  <p style={{ fontSize: "0.875rem", fontWeight: 600 }}>Quiz Master</p>
                  <p style={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>Complete 10 quizzes</p>
                </div>
                <div style={{ padding: "1.5rem", background: "var(--secondary)", borderRadius: "var(--radius)", textAlign: "center", opacity: profile.accuracy >= 80 ? 1 : 0.4 }}>
                  <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>🎯</div>
                  <p style={{ fontSize: "0.875rem", fontWeight: 600 }}>Accuracy Pro</p>
                  <p style={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>{profile.accuracy}% accuracy</p>
                </div>
                <div style={{ padding: "1.5rem", background: "var(--secondary)", borderRadius: "var(--radius)", textAlign: "center", opacity: profile.totalScore >= 1000 ? 1 : 0.4 }}>
                  <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>💎</div>
                  <p style={{ fontSize: "0.875rem", fontWeight: 600 }}>Score Collector</p>
                  <p style={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>Earn 1000+ points</p>
                </div>
                <div style={{ padding: "1.5rem", background: "var(--secondary)", borderRadius: "var(--radius)", textAlign: "center", opacity: profile.totalScore >= 5000 ? 1 : 0.4 }}>
                  <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>👑</div>
                  <p style={{ fontSize: "0.875rem", fontWeight: 600 }}>Legend</p>
                  <p style={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>Earn 5000+ points</p>
                </div>
              </div>
            </div>
          ) : activeTab === "history" ? (
            <div>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1.5rem" }}>📜 Quiz History</h3>
              
              {loadingHistory ? (
                <div style={{ textAlign: "center", padding: "2rem" }}>
                  <div className="animate-spin" style={{ fontSize: "1.5rem" }}>⚡</div>
                  <p style={{ marginTop: "0.5rem", color: "var(--muted-foreground)" }}>Loading history...</p>
                </div>
              ) : quizHistory.length === 0 ? (
                <div style={{ textAlign: "center", padding: "3rem", background: "var(--secondary)", borderRadius: "var(--radius)" }}>
                  <BookOpen size={48} style={{ margin: "0 auto 1rem", opacity: 0.2 }} />
                  <p style={{ color: "var(--muted-foreground)" }}>No quizzes played yet. Start your first quiz today!</p>
                  <button className="btn btn-primary" style={{ marginTop: "1rem" }} onClick={() => navigate("/dashboard")}>
                    Go to Dashboard
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {quizHistory.map((quiz) => (
                    <div 
                      key={quiz._id} 
                      className="card glass glow-border animate-fade-in" 
                      style={{ padding: "1.25rem", cursor: "pointer", transition: "transform 0.2s" }}
                      onClick={() => setSelectedQuiz(quiz)}
                      onMouseOver={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
                      onMouseOut={(e) => e.currentTarget.style.transform = "translateY(0)"}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.25rem" }}>
                            <span style={{ fontWeight: 700, fontSize: "1.1rem" }}>{quiz.subject}</span>
                            <span className="badge" style={{ fontSize: "0.7rem", background: "var(--primary-foreground)", color: "var(--primary)" }}>
                              {quiz.mode.toUpperCase()}
                            </span>
                          </div>
                          <p style={{ fontSize: "0.85rem", color: "var(--muted-foreground)" }}>
                            {formatDate(quiz.createdAt)} • {quiz.topics?.length > 0 ? quiz.topics.join(", ") : "General Topics"}
                          </p>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <p style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--warning)" }}>{quiz.score} pts</p>
                          <p style={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>
                            {quiz.correctAnswers}/{quiz.totalQuestions} Correct
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Quiz Detail Modal */}
              {selectedQuiz && (
                <div style={{
                  position: "fixed",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  background: "rgba(0,0,0,0.8)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 1000,
                  padding: "1rem"
                }}>
                  <div className="card glow-border animate-scale-in" style={{ 
                    width: "min(800px, 100%)", 
                    maxHeight: "90vh", 
                    overflowY: "auto",
                    background: "var(--background)",
                    padding: "2rem",
                    position: "relative"
                  }}>
                    <button 
                      onClick={() => setSelectedQuiz(null)}
                      style={{ position: "absolute", top: "1rem", right: "1rem", background: "none", border: "none", color: "var(--foreground)", cursor: "pointer" }}
                    >
                      <X size={24} />
                    </button>
                    
                    <h2 style={{ marginBottom: "0.5rem" }}>{selectedQuiz.subject} Quiz Details</h2>
                    <p style={{ color: "var(--muted-foreground)", marginBottom: "1.5rem" }}>
                      {formatDate(selectedQuiz.createdAt)} • Score: {selectedQuiz.score} • Accuracy: {Math.round((selectedQuiz.correctAnswers / selectedQuiz.totalQuestions) * 100)}%
                    </p>

                    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                      {selectedQuiz.questions.map((q, idx) => (
                        <div key={idx} style={{ padding: "1.25rem", background: "var(--secondary)", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
                          <p style={{ fontWeight: 600, marginBottom: "1rem" }}>{idx + 1}. {q.question}</p>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.75rem" }}>
                            {q.options.map((opt, optIdx) => {
                              const isCorrect = optIdx === q.correctAnswer;
                              const isUserAnswer = optIdx === q.userAnswer;
                              
                              let border = "1px solid var(--border)";
                              let bg = "transparent";
                              
                              if (isCorrect) {
                                border = "2px solid var(--success)";
                                bg = "rgba(160, 200, 100, 0.1)";
                              } else if (isUserAnswer && !isCorrect) {
                                border = "2px solid var(--destructive)";
                                bg = "rgba(200, 100, 100, 0.1)";
                              }

                              return (
                                <div key={optIdx} style={{ 
                                  padding: "0.75rem", 
                                  borderRadius: "var(--radius)", 
                                  border, 
                                  background: bg,
                                  fontSize: "0.9rem",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between"
                                }}>
                                  <span>{opt}</span>
                                  {isCorrect && <Check size={16} color="var(--success)" />}
                                  {isUserAnswer && !isCorrect && <X size={16} color="var(--destructive)" />}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1.5rem" }}>🔐 Change Password</h3>
              {!changingPassword ? (
                <button
                  className="btn btn-outline"
                  onClick={() => setChangingPassword(true)}
                  style={{ borderColor: "var(--accent)", color: "var(--accent)" }}
                >
                  <Lock size={16} /> Update Password
                </button>
              ) : (
                <div style={{ maxWidth: "400px" }}>
                  <div style={{ marginBottom: "1rem" }}>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", fontWeight: 500 }}>
                      New Password
                    </label>
                    <div style={{ position: "relative" }}>
                      <input
                        type={showPassword ? "text" : "password"}
                        className="input"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="At least 8 characters, 1 uppercase, 1 number"
                        style={{ paddingRight: "2.5rem" }}
                      />
                      <button
                        style={{
                          position: "absolute",
                          right: "0.75rem",
                          top: "50%",
                          transform: "translateY(-50%)",
                          color: "var(--muted-foreground)",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: "0.5rem"
                        }}
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div style={{ marginBottom: "1rem" }}>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", fontWeight: 500 }}>
                      Confirm Password
                    </label>
                    <input
                      type={showPassword ? "text" : "password"}
                      className="input"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your password"
                    />
                  </div>

                  {passwordMsg && (
                    <div style={{
                      padding: "0.75rem",
                      background: passwordMsg.includes("✓") ? "rgba(160, 200, 100, 0.1)" : "rgba(200, 100, 100, 0.1)",
                      borderRadius: "var(--radius)",
                      marginBottom: "1rem",
                      fontSize: "0.875rem",
                      color: passwordMsg.includes("✓") ? "var(--success)" : "var(--destructive)"
                    }}>
                      {passwordMsg}
                    </div>
                  )}

                  <div style={{ display: "flex", gap: "0.75rem" }}>
                    <button
                      className="btn btn-primary"
                      onClick={handleChangePassword}
                    >
                      <Check size={16} /> Save Changes
                    </button>
                    <button
                      className="btn btn-ghost"
                      onClick={() => {
                        setChangingPassword(false);
                        setNewPassword("");
                        setConfirmPassword("");
                        setPasswordMsg("");
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sign Out Button */}
        <button
          className="btn btn-outline btn-full"
          style={{ color: "var(--accent)", borderColor: "var(--accent)", padding: "0.75rem" }}
          onClick={signOut}
        >
          <LogOut size={18} /> Sign Out
        </button>
      </main>
    </div>
  );
};

export default Profile;
