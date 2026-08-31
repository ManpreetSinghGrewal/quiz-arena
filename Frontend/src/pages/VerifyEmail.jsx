import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { BrainCircuit, ArrowRight, ShieldCheck, RefreshCw } from "lucide-react";
import AnimatedBackground from "@/components/AnimatedBackground";
import { verifyEmailOtp, resendVerificationOtp } from "../services/authService";
import { useAuth } from "@/contexts/AuthContext";

const VerifyEmail = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [info, setInfo] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setEmail(emailParam);
    } else {
      setError("No email address provided for verification. Please sign up or log in.");
    }
  }, [searchParams]);

  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");

    if (!code || code.length !== 6) {
      setError("Please enter a valid 6-digit verification code.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await verifyEmailOtp(email, code);
      if (!res.ok) {
        setError(res.message || "Invalid or expired verification code.");
        return;
      }

      setInfo("Account verified successfully! Logging you in...");
      
      // Save session credentials
      if (res.token && res.user) {
        setTimeout(() => {
          login(res.user, res.token);
          navigate("/dashboard");
        }, 1200);
      } else {
        setTimeout(() => navigate("/login"), 1200);
      }
    } catch (err) {
      setError("Cannot connect to server. Make sure the backend is running.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!email) return;
    setError("");
    setInfo("");
    setIsResending(true);
    try {
      const res = await resendVerificationOtp(email);
      if (!res.ok) {
        setError(res.message || "Failed to resend verification code.");
        return;
      }

      if (res.verificationCode) {
        setInfo(`Dev OTP: ${res.verificationCode} (sent to ${email})`);
      } else {
        setInfo(`A fresh 6-digit OTP code has been sent to ${email}`);
      }
    } catch (err) {
      setError("Cannot connect to server. Make sure the backend is running.");
    } finally {
      setIsResending(false);
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
            <h1 className="auth-title">Verify your email</h1>
            <p className="auth-subtitle">
              Enter the 6-digit OTP code sent to your email to activate your account
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
                marginBottom: "1rem",
                wordBreak: "break-word"
              }}
            >
              {error || info}
            </div>
          )}

          <form onSubmit={handleVerify} className="auth-form">
            <div className="form-group">
              <label htmlFor="code" className="form-label">Verification OTP Code</label>
              <input
                type="text"
                id="code"
                className="form-control"
                placeholder="Enter 6-digit code"
                value={code}
                onChange={(e) => setCode(e.target.value.trim().replace(/\D/g, "").slice(0, 6))}
                disabled={isLoading || !email}
                required
                maxLength={6}
                style={{
                  textAlign: "center",
                  letterSpacing: "4px",
                  fontSize: "1.25rem",
                  fontWeight: "bold"
                }}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={isLoading || !email || code.length !== 6}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
            >
              {isLoading ? "Verifying..." : "Verify Account"}
              <ArrowRight style={{ width: "1.25rem", height: "1.25rem" }} />
            </button>
          </form>

          <div style={{ marginTop: "1.5rem", textAlign: "center", fontSize: "0.875rem" }}>
            <span style={{ color: "var(--muted-foreground)" }}>Didn't receive a code? </span>
            <button
              onClick={handleResendCode}
              disabled={isResending || !email}
              style={{
                background: "none",
                border: "none",
                color: "var(--primary)",
                fontWeight: "600",
                cursor: email ? "pointer" : "not-allowed",
                padding: 0,
                display: "inline-flex",
                alignItems: "center",
                gap: "0.25rem"
              }}
            >
              {isResending ? (
                <>
                  <RefreshCw className="animate-spin" style={{ width: "0.875rem", height: "0.875rem" }} />
                  Resending...
                </>
              ) : (
                "Resend Code"
              )}
            </button>
          </div>

          <div style={{ marginTop: "2rem", textAlign: "center" }}>
            <Link to="/login" style={{ fontSize: "0.875rem", color: "var(--muted-foreground)" }}>
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>

      <div className="auth-deco gradient-primary">
        <div className="auth-deco-orb animate-float" style={{ top: "5rem", left: "2.5rem", width: "5rem", height: "5rem" }} />
        <div className="auth-deco-orb animate-float-delayed" style={{ bottom: "5rem", right: "2.5rem", width: "8rem", height: "8rem" }} />
        <div className="auth-deco-orb animate-float-slow" style={{ top: "50%", right: "5rem", width: "4rem", height: "4rem" }} />
        <div className="auth-deco-content">
          <ShieldCheck style={{ width: "4rem", height: "4rem", color: "var(--primary)", margin: "0 auto 1.5rem" }} />
          <h2>Secure Your Account</h2>
          <p>
            We use secure email OTP codes to verify account ownership and prevent unauthorized signups in the QuizArena.
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
