import { useEffect, useRef } from "react";
import type { AppMode } from "../lib/theme";
import type { MoodEntry } from "../hooks/useMood";

interface FluidBackgroundProps {
  mode: AppMode;
  todayMood: MoodEntry | null;
}

const LOW_MOODS = new Set(["😔", "😢"]);

export default function FluidBackground({ mode, todayMood }: FluidBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (mode === "focus") return; // No particles in focus mode

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let raf: number;
    const particles: { x: number; y: number; vx: number; vy: number; life: number; hue: number }[] = [];

    const isLow = todayMood ? LOW_MOODS.has(todayMood.mood) : false;
    const baseHue = isLow ? 230 : 195; // softer blue for low, cyan for positive
    const maxParticles = isLow ? 40 : 100;
    const baseAlpha = isLow ? 0.25 : 0.5;

    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    function animate() {
      ctx!.fillStyle = "rgba(10, 10, 35, 0.88)";
      ctx!.fillRect(0, 0, canvas!.width, canvas!.height);

      if (particles.length < maxParticles) {
        particles.push({
          x: Math.random() * canvas!.width,
          y: canvas!.height * (0.5 + Math.random() * 0.5),
          vx: (Math.random() - 0.5) * 0.4,
          vy: -(0.3 + Math.random() * 0.8),
          life: 100 + Math.random() * 80,
          hue: baseHue + (Math.random() - 0.5) * 20,
        });
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy *= 0.997;
        p.vx += (Math.random() - 0.5) * 0.02;
        p.life--;

        const alpha = (p.life / 180) * baseAlpha;
        ctx!.fillStyle = `hsla(${p.hue}, 80%, 65%, ${alpha})`;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
        ctx!.fill();

        if (p.life <= 0) particles.splice(i, 1);
      }

      raf = requestAnimationFrame(animate);
    }

    animate();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [mode, todayMood]);

  if (mode === "focus") return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[-1]"
      style={{ mixBlendMode: "screen" }}
    />
  );
}
