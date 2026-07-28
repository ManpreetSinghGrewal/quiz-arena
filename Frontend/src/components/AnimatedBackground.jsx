import { useEffect, useRef, useState } from "react";

const AnimatedBackground = ({ variant = "default" }) => {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: -1000, y: -1000, active: false });
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 });

  // Handle global mouse move for ambient light glow
  useEffect(() => {
    const handleMouseMove = (e) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
      mouseRef.current.active = true;
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  // Canvas interactive particle constellation effect for default and particles variants
  useEffect(() => {
    if (variant === "gradient") return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    const particleCount = Math.min(Math.floor((width * height) / 18000), 75);
    const particles = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        size: Math.random() * 2.5 + 1,
        baseOpacity: Math.random() * 0.4 + 0.2,
        opacity: Math.random() * 0.4 + 0.2,
        hue: Math.random() > 0.4 ? 250 + Math.random() * 40 : 330 + Math.random() * 30, // Purple-blue & Pink-violet
        pulse: Math.random() * Math.PI * 2,
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const isMouseActive = mouseRef.current.active;

      // Draw subtle interactive spotlight around cursor
      if (isMouseActive) {
        const spotGrad = ctx.createRadialGradient(mx, my, 0, mx, my, 350);
        spotGrad.addColorStop(0, "hsla(250, 90%, 65%, 0.08)");
        spotGrad.addColorStop(0.5, "hsla(280, 85%, 60%, 0.03)");
        spotGrad.addColorStop(1, "transparent");
        ctx.fillStyle = spotGrad;
        ctx.fillRect(0, 0, width, height);
      }

      // Update & render particles
      particles.forEach((p) => {
        p.pulse += 0.02;
        p.x += p.vx;
        p.y += p.vy;

        // Wrap edges
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;
        if (p.y < -10) p.y = height + 10;
        if (p.y > height + 10) p.y = -10;

        // Mouse influence
        let currentSize = p.size;
        if (isMouseActive) {
          const dx = mx - p.x;
          const dy = my - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 180) {
            const factor = (180 - dist) / 180;
            p.x -= (dx / dist) * factor * 0.8;
            p.y -= (dy / dist) * factor * 0.8;
            currentSize = p.size + factor * 2;
          }
        }

        const alpha = p.baseOpacity + Math.sin(p.pulse) * 0.15;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.5, currentSize), 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 85%, 65%, ${Math.min(1, Math.max(0.05, alpha))})`;
        ctx.shadowColor = `hsla(${p.hue}, 90%, 65%, 0.6)`;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Draw constellation connections
      const maxConnectDist = 140;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const p1 = particles[i];
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxConnectDist) {
            const alpha = (1 - dist / maxConnectDist) * 0.25;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `hsla(260, 80%, 70%, ${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationId);
    };
  }, [variant]);

  return (
    <div className="bg-animated">
      {/* Dynamic Cursor Light Flare */}
      {mousePos.x > -500 && (
        <div
          className="bg-cursor-flare"
          style={{
            transform: `translate(${mousePos.x - 250}px, ${mousePos.y - 250}px)`,
          }}
        />
      )}

      {/* Floating Glowing Neon Ambient Orbs */}
      <div
        className="bg-orb animate-float"
        style={{
          top: "-8rem",
          right: "-8rem",
          width: "28rem",
          height: "28rem",
          background: "radial-gradient(circle, hsla(250, 95%, 65%, 0.28) 0%, hsla(270, 85%, 55%, 0.05) 70%, transparent 100%)",
        }}
      />
      <div
        className="bg-orb animate-float-delayed"
        style={{
          top: "35%",
          left: "-12rem",
          width: "32rem",
          height: "32rem",
          background: "radial-gradient(circle, hsla(340, 90%, 62%, 0.22) 0%, hsla(310, 80%, 50%, 0.04) 70%, transparent 100%)",
          filter: "blur(110px)",
        }}
      />
      <div
        className="bg-orb animate-float-slow"
        style={{
          bottom: "-10rem",
          right: "25%",
          width: "26rem",
          height: "26rem",
          background: "radial-gradient(circle, hsla(280, 90%, 65%, 0.24) 0%, hsla(230, 80%, 60%, 0.04) 70%, transparent 100%)",
        }}
      />
      <div
        className="bg-orb animate-pulse-slow"
        style={{
          top: "45%",
          left: "55%",
          transform: "translate(-50%, -50%)",
          width: "42rem",
          height: "42rem",
          background: "radial-gradient(circle, hsla(250, 90%, 65%, 0.12) 0%, transparent 70%)",
          filter: "blur(140px)",
        }}
      />

      {/* Cyber Grid with glowing scanlines */}
      <div className="bg-grid" />
      <div className="bg-scanline" />

      {/* Canvas for interactive constellation & particles */}
      {variant !== "gradient" && (
        <canvas ref={canvasRef} className="bg-canvas-particles" />
      )}
    </div>
  );
};

export default AnimatedBackground;

