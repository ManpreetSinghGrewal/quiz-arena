import { useState } from "react";
import { BrainCircuit, Eye, EyeOff, ArrowRight, Check } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../services/authService";

import { getApiBase } from "../lib/utils";
import AnimatedBackground from "@/components/AnimatedBackground";

const Signup = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

const passwordRequirements = [
    { label: "At least 8 characters", met: formData.password.length >= 8 },
    { label: "Contains a number", met: /\d/.test(formData.password) },
    { label: "Contains uppercase", met: /[A-Z]/.test(formData.password) },
  ];

const handleSubmit = async (e) => {
  e.preventDefault();
  setIsLoading(true);
  setError("");

  try {
    const apiBase = getApiBase();

    const response = await fetch(`${apiBase}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    const data = await response.json();

    if (!response.ok) {
      // Backend validation error
      setError(data.message);
      setIsLoading(false);
      return;
    }

    // Success only if status is 201
    setSuccess(true);

    setTimeout(() => {
      navigate("/login");
    }, 2000);

  } catch (err) {
    setError("Cannot connect to server");
  }

  setIsLoading(false);
};


  return (
    <div className="page-split">
      <div className="auth-deco gradient-accent">
        <div className="auth-deco-orb animate-float" style={{ top: "5rem", right: "2.5rem", width: "6rem", height: "6rem" }} />
        <div className="auth-deco-orb animate-float-delayed" style={{ bottom: "5rem", left: "2.5rem", width: "8rem", height: "8rem", background: "hsla(0, 0%, 100%, 0.05)" }} />
        <div className="auth-deco-orb animate-float-slow" style={{ top: "33%", left: "5rem", width: "4rem", height: "4rem" }} />
        <div className="auth-deco-content">
          <h2>Join the Arena!</h2>
          <p>Create your account and start competing with aspirants preparing for GATE and UCA from around the world.</p>
          <div className="auth-feature-list">
            {[
              "Test your knowledge with challenging quizzes",
              "Compete in real-time multiplayer battles",
              "Track your progress on the leaderboard",
              "Earn achievements and climb the ranks",
            ].map((feature) => (
              <div key={feature} className="auth-feature-item">
                <div className="auth-feature-check"><Check /></div>
                <span style={{ fontSize: "0.875rem", fontWeight: 500 }}>{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="auth-panel">
        <AnimatedBackground variant="mesh" />
        <div className="auth-form-wrapper animate-fade-in">
          <div className="auth-logo">
            <Link to="/">
              <div className="auth-logo-icon gradient-primary">
                <BrainCircuit style={{ width: "1.75rem", height: "1.75rem", color: "var(--primary-foreground)" }} />
              </div>
              <span className="logo-text" style={{ fontSize: "1.5rem" }}>QuizArena</span>
            </Link>
            <h1 className="auth-title">Create an account</h1>
            <p className="auth-subtitle">Start your quiz journey today</p>
          </div>

          {error && (
            <div style={{ padding: "0.75rem 1rem", borderRadius: "var(--radius)", background: "hsla(0, 70%, 50%, 0.15)", border: "1px solid hsla(0, 70%, 50%, 0.3)", color: "var(--accent)", fontSize: "0.85rem", marginBottom: "0.5rem" }}>
              {error}
            </div>
          )}

          {success ? (
            <div className="card" style={{ padding: "2rem", textAlign: "center" }}>
              <div style={{ width: 60, height: 60, borderRadius: "50%", background: "hsla(160, 80%, 45%, 0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
                <Check style={{ width: 30, height: 30, color: "var(--success)" }} />
              </div>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem" }}>Check your email!</h2>
              <p style={{ color: "var(--muted-foreground)", fontSize: "0.875rem" }}>
                We've sent a confirmation link to <strong>{formData.email}</strong>. Click the link to activate your account.
              </p>
              <Link to="/login" className="btn btn-gradient" style={{ marginTop: "1.5rem", display: "inline-flex" }}>Go to Login</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label className="label" htmlFor="name">Full Name</label>
                <input id="name" type="text" placeholder="John Doe" value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })} required className="input" />
              </div>
              <div className="form-group">
                <label className="label" htmlFor="email">Email</label>
                <input id="email" type="email" placeholder="you@example.com" value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })} required className="input" />
              </div>
              <div className="form-group">
                <label className="label" htmlFor="password">Password</label>
                <div className="input-wrapper">
                  <input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••"
                    value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required className="input" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="input-toggle">
                    {showPassword ? <EyeOff /> : <Eye />}
                  </button>
                </div>
                <div className="password-reqs">
                  {passwordRequirements.map((req) => (
                    <div key={req.label} className="password-req">
                      <div className={`password-req-dot ${req.met ? "met" : "unmet"}`}>{req.met && <Check />}</div>
                      <span style={{ color: req.met ? "var(--foreground)" : "var(--muted-foreground)" }}>{req.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <button type="submit" className="btn btn-gradient btn-lg btn-full" disabled={isLoading}>
                {isLoading ? "Creating account..." : <><span>Create account</span> <ArrowRight style={{ width: "1.25rem", height: "1.25rem" }} /></>}
              </button>
            </form>
          )}

          <p className="auth-footer">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
