import { BrainCircuit, BookOpen, Calendar, Swords, Zap, ArrowRight, Trophy, Users, Target } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import AnimatedBackground from "@/components/AnimatedBackground";
import Header from "@/components/Header";

const Index = () => {
  const navigate = useNavigate();

  const features = [
    { icon: BookOpen, title: "Normal Quiz", description: "Practice with quizzes at your own pace across multiple difficulty levels", iconBg: "hsla(250, 90%, 65%, 0.1)", iconColor: "var(--game-normal)" },
    { icon: Calendar, title: "Daily Challenge", description: "One shot per day to prove your knowledge and compete for daily rewards", iconBg: "hsla(280, 85%, 65%, 0.1)", iconColor: "var(--game-daily)" },
    { icon: Swords, title: "Battle Mode", description: "Challenge friends or strangers in real-time multiplayer quiz battles", iconBg: "hsla(340, 85%, 60%, 0.1)", iconColor: "var(--game-battle)" },
    { icon: Zap, title: "Speed Quiz", description: "Race against the clock and answer as many questions as possible", iconBg: "hsla(160, 80%, 45%, 0.1)", iconColor: "var(--game-speed)" },
  ];

  const stats = [
    { value: "10K+", label: "Active Players" },
    { value: "500+", label: "Quiz Questions" },
    { value: "50K+", label: "Games Played" },
  ];

  return (
    <div className="page" style={{ overflow: "hidden" }}>
      <AnimatedBackground variant="default" />

      <Header />

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-inner animate-fade-in">
          <div className="hero-badge">
            <Trophy style={{ width: "1rem", height: "1rem" }} />
            <span>Join 10,000+ students already learning</span>
          </div>
          <h1 className="hero-title">
            Test Your Knowledge.<br />
            <span className="text-gradient">Challenge Your Friends.</span>
          </h1>
          <p className="hero-subtitle">
            The ultimate quiz platform for CBSE Board students. Practice solo, compete in real-time battles, and climb the leaderboard.
          </p>
          <div className="hero-actions">
            <button className="btn btn-gradient btn-xl" onClick={() => navigate("/signup")}>
              Start Playing Free <ArrowRight style={{ width: "1.25rem", height: "1.25rem" }} />
            </button>
            <button className="btn btn-outline btn-xl" onClick={() => navigate("/login")}>
              I already have an account
            </button>
          </div>

          <div className="hero-stats animate-fade-in" style={{ animationDelay: "200ms" }}>
            {stats.map((stat) => (
              <div key={stat.label} style={{ textAlign: "center" }}>
                <p className="hero-stat-value">{stat.value}</p>
                <p className="hero-stat-label">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="features-inner">
          <div style={{ textAlign: "center", marginBottom: "3rem" }} className="animate-fade-in">
            <h2 className="section-title">Four Ways to Play</h2>
            <p className="section-subtitle">Choose your game mode and start testing your knowledge today</p>
          </div>
          <div className="features-grid">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="feature-card glow-border animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="feature-card-icon" style={{ background: feature.iconBg }}>
                  <feature.icon style={{ width: "1.75rem", height: "1.75rem", color: feature.iconColor }} />
                </div>
                <h3 className="feature-card-title">{feature.title}</h3>
                <p className="feature-card-desc">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Section */}
      <section className="why-section">
        <div className="why-inner">
          <div className="why-grid">
            <div className="animate-fade-in">
              <h2 className="section-title">Why Students Love QuizArena</h2>
              <div className="why-list" style={{ marginTop: "1.5rem" }}>
                {[
                  { icon: Target, title: "Track Your Progress", description: "Monitor your scores, streaks, and improvement over time with detailed analytics" },
                  { icon: Users, title: "Compete with Friends", description: "Challenge classmates to real-time battles and see who knows more" },
                  { icon: Trophy, title: "Earn Achievements", description: "Unlock badges and climb the leaderboard as you master different topics" },
                ].map((item, index) => (
                  <div key={item.title} className="why-item animate-slide-in" style={{ animationDelay: `${index * 100}ms` }}>
                    <div className="why-item-icon">
                      <item.icon />
                    </div>
                    <div>
                      <h3 className="why-item-title">{item.title}</h3>
                      <p className="why-item-desc">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Preview Card */}
            <div className="preview-card animate-fade-in" style={{ animationDelay: "200ms" }}>
              <div className="preview-card-inner glow-border">
                <div className="preview-card-header">
                  <div className="preview-card-user">
                    <div className="avatar" style={{ background: "var(--gradient-primary)", color: "var(--primary-foreground)" }}>AJ</div>
                    <div>
                      <p style={{ fontWeight: 600, color: "var(--foreground)" }}>Alex Johnson</p>
                      <p style={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>Level 8 • 12,450 pts</p>
                    </div>
                  </div>
                  <div className="preview-card-badge">5 day streak 🔥</div>
                </div>
                <div className="preview-card-stats">
                  {[
                    { label: "Quizzes", value: "47" },
                    { label: "Win Rate", value: "68%" },
                    { label: "Rank", value: "#5" },
                  ].map((stat) => (
                    <div key={stat.label} className="preview-stat">
                      <p className="preview-stat-value">{stat.value}</p>
                      <p className="preview-stat-label">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="preview-blur" style={{ top: "2rem", right: "-2rem", width: "18rem", height: "18rem", background: "hsla(250, 90%, 65%, 0.05)" }} />
              <div className="preview-blur" style={{ bottom: "-2rem", left: "-2rem", width: "18rem", height: "18rem", background: "hsla(340, 85%, 60%, 0.05)" }} />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-inner">
          <div className="cta-box gradient-primary animate-fade-in">
            <h2 className="cta-title">Ready to Test Your Knowledge?</h2>
            <p className="cta-desc">
              Join thousands of students already competing on QuizArena. Sign up for free and start playing today!
            </p>
            <button className="btn btn-white btn-xl" onClick={() => navigate("/signup")}>
              Create Free Account <ArrowRight style={{ width: "1.25rem", height: "1.25rem" }} />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-logo">
            <div className="footer-logo-icon gradient-primary">
              <BrainCircuit style={{ width: "1.25rem", height: "1.25rem", color: "var(--primary-foreground)" }} />
            </div>
            <span style={{ fontWeight: 700, color: "var(--foreground)" }}>QuizArena</span>
          </div>
          <p className="footer-text">© 2025 QuizArena. Built for CBSE Board students.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
