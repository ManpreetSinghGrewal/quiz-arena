import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import AnimatedBackground from "@/components/AnimatedBackground";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="page-center">
      <AnimatedBackground variant="particles" />
      <div className="glass-card text-center" style={{ maxWidth: "450px", padding: "3rem 2rem", zIndex: 10 }}>
        <h1 className="hero-title" style={{ fontSize: "5rem", marginBottom: "0.5rem" }}>
          <span className="text-gradient">404</span>
        </h1>
        <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>Page Not Found</h2>
        <p className="text-muted" style={{ marginBottom: "2rem" }}>
          The page <code style={{ color: "var(--primary)" }}>{location.pathname}</code> does not exist or has been moved.
        </p>
        <Link to="/" className="btn btn-gradient btn-lg w-full">
          Return to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
