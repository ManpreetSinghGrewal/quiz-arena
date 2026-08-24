import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BrainCircuit, ArrowRight } from "lucide-react";
import AnimatedBackground from "@/components/AnimatedBackground";
import { requestPasswordReset, resetPasswordWithCode } from "../services/authService";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [info, setInfo] = useState("");
  const [error, setError] = useState("");

  const sendCode = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setIsLoading(true);
    try {
      const res = await requestPasswordReset(email);
      if (!res.ok) {
        setError(res.message || "Failed to send reset code");
        return;
      }
      if (res.resetCode) {
        setInfo(`Dev reset code: ${res.resetCode} (expires in ${res.expiresInMinutes || 10} min)`);
      } else {
        setInfo(res.message || "If the account exists, a reset code has been created.");
      }
      setStep(2);
    } catch (err) {
      setError("Cannot connect to server. Make sure the backend is running on port 5000.");
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      const res = await resetPasswordWithCode(email, code, newPassword);
      if (res.ok && res.message && String(res.message).toLowerCase().includes("success")) {
        setInfo(res.message);
        setTimeout(() => navigate("/login"), 800);
      } else {
        setError(res.message || "Failed to reset password");
      }
    } catch (err) {
      setError("Cannot connect to server. Make sure the backend is running on port 5000.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-split">
      <AnimatedBackground variant="particles" />

      <div className="auth-panel">
        <div className="auth-form-wrapper animate-fade-in">
          <div className="auth-logo">
            <Link to="/">
              <div className="auth-logo-icon gradient-primary">
                <BrainCircuit style={{ width: "1.75rem", height: "1.75rem", color: "var(--primary-foreground)" }} />
              </div>
              <span className="logo-text" style={{ fontSize: "1.5rem" }}>QuizArena</span>
            </Link>
            <h1 className="auth-title">Reset your password</h1>
            <p className="auth-subtitle">
              {step === 1 ? "Enter your email to get a reset code" : "Enter the code and set a new password"}
            </p>
          </div>

          {(error || info) && (
            <div
              style={{
                padding: "0.75rem 1rem",
                borderRadius: "var(--radius)",
                background: error ? "hsla(0, 70%, 50%, 0.15)" : "hsla(150, 70%, 45%, 0.15)",
                border: `1px solid ${error ? "hsla(0, 70%, 50%, 0.3)" : "hsla(150, 70%, 45%, 0.3)"}`,
                color: error ? "var(--accent)" : "var(--success)",
                fontSize: "0.85rem",
                marginBottom: "0.5rem",
              }}
            >
              {error || info}
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={sendCode} className="auth-form">
              <div className="form-group">
                <label className="label" htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="input"
                />
              </div>

              <button type="submit" className="btn btn-gradient btn-lg btn-full" disabled={isLoading}>
                {isLoading ? "Sending..." : <><span>Send reset code</span> <ArrowRight style={{ width: "1.25rem", height: "1.25rem" }} /></>}
              </button>
            </form>
          ) : (
            <form onSubmit={resetPassword} className="auth-form">
              <div className="form-group">
                <label className="label" htmlFor="code">Reset code</label>
                <input
                  id="code"
                  inputMode="numeric"
                  placeholder="6-digit code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                  className="input"
                />
              </div>

              <div className="form-group">
                <label className="label" htmlFor="newPassword">New password</label>
                <input
                  id="newPassword"
                  type="password"
                  placeholder="At least 8 chars, 1 uppercase, 1 number"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="input"
                />
              </div>

              <div className="form-group">
                <label className="label" htmlFor="confirmPassword">Confirm password</label>
                <input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="input"
                />
              </div>

              <button type="submit" className="btn btn-gradient btn-lg btn-full" disabled={isLoading}>
                {isLoading ? "Resetting..." : <><span>Reset password</span> <ArrowRight style={{ width: "1.25rem", height: "1.25rem" }} /></>}
              </button>

              <button
                type="button"
                className="btn btn-ghost btn-full"
                style={{ marginTop: "0.75rem" }}
                onClick={() => setStep(1)}
              >
                Back
              </button>
            </form>
          )}

          <p className="auth-footer">
            Remembered it? <Link to="/login">Back to login</Link>
          </p>
        </div>
      </div>

      <div className="auth-deco gradient-primary">
        <div className="auth-deco-content">
          <h2>Secure your account</h2>
          <p>Reset codes expire quickly. Pick a strong password to keep your progress safe.</p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;

