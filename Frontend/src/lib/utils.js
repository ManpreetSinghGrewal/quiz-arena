export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

export function getApiBase() {
  const configured = import.meta.env.VITE_API_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");

  if (typeof window !== "undefined") {
    if (window.location.port === "8085") {
      return "";
    }
    // Direct local IP connections to backend port 8085
    const isLocal = 
      window.location.hostname === "localhost" || 
      window.location.hostname === "127.0.0.1" || 
      window.location.hostname.startsWith("192.168.") || 
      window.location.hostname.startsWith("10.") || 
      window.location.hostname.endsWith(".local");

    if (isLocal) {
      return `http://${window.location.hostname}:8085`;
    }
    return window.location.origin;
  }

  return "http://localhost:8085";
}

