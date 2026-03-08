import React, { useRef, useEffect, useCallback } from "react";
import type { DiaryMap } from "../types";
import type { AppMode } from "../lib/theme";

interface ResonanceCanvasProps {
  weeksPassed: number;
  totalYears: number;
  diaryEntries: DiaryMap;
  zoom: number;
  offsetX: number;
  offsetY: number;
  mode: AppMode;
  hudVisible: boolean;
  onWeekSelect: (weekIndex: number, row: number, col: number) => void;
}

const COLS = 52;
const BASE_CELL = 16;
const GAP = 2;
const LABEL_W = 30;
const HEADER_H = 20;

// Particles that rise through the grid
interface Particle { x: number; y: number; vy: number; life: number; maxLife: number; hue: number; size: number }

const ResonanceCanvas: React.FC<ResonanceCanvasProps> = ({
  weeksPassed, totalYears, diaryEntries, zoom, offsetX, offsetY, mode, hudVisible, onWeekSelect,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);

  const draw = useCallback((time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    const t = time / 1000;
    const isFocus = mode === "focus";
    const cell = BASE_CELL * zoom;
    const gap = GAP * zoom;
    const step = cell + gap;
    const labelW = LABEL_W * zoom;
    const headerH = HEADER_H * zoom;

    // ── Background ──────────────────────────────────────────
    if (isFocus) {
      ctx.fillStyle = "#000";
    } else {
      const bg = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.7);
      bg.addColorStop(0, "#0e0e2a");
      bg.addColorStop(1, "#060614");
      ctx.fillStyle = bg;
    }
    ctx.fillRect(0, 0, w, h);

    // ── Particles (behind grid) ─────────────────────────────
    if (!isFocus) {
      const particles = particlesRef.current;
      if (particles.length < 60) {
        particles.push({
          x: Math.random() * w,
          y: h + 10,
          vy: -(0.3 + Math.random() * 0.6),
          life: 0,
          maxLife: 200 + Math.random() * 200,
          hue: 185 + Math.random() * 30,
          size: 1 + Math.random() * 1.5,
        });
      }
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.y += p.vy;
        p.x += Math.sin(t + p.x * 0.01) * 0.15;
        p.life++;
        const alpha = Math.sin((p.life / p.maxLife) * Math.PI) * 0.35;
        ctx.fillStyle = `hsla(${p.hue}, 80%, 70%, ${alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        if (p.life >= p.maxLife) particles.splice(i, 1);
      }
    }

    ctx.save();
    ctx.translate(offsetX, offsetY);

    // ── Breathing pulse ─────────────────────────────────────
    const breathe = isFocus ? 1 : 0.88 + 0.12 * Math.sin(t * 0.8);

    // ── HUD: Week headers (fade with hudVisible) ────────────
    const hudAlpha = hudVisible ? 1 : 0;
    if (hudAlpha > 0 && zoom > 0.6) {
      const fontSize = Math.max(7, Math.min(11, 9 * zoom));
      ctx.font = `600 ${fontSize}px system-ui, -apple-system, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.globalAlpha = hudAlpha * 0.6;

      for (let c = 0; c < COLS; c++) {
        const x = labelW + c * step + cell / 2;
        if (x + offsetX < -step || x + offsetX > w + step) continue;
        ctx.fillStyle = isFocus ? "#555" : "#00d4ff50";
        ctx.fillText(`${c + 1}`, x, headerH / 2);
      }
      ctx.globalAlpha = 1;
    }

    // ── Grid rows ───────────────────────────────────────────
    for (let row = 0; row < totalYears; row++) {
      const y = headerH + row * step;
      if (y + offsetY > h + step || y + offsetY + cell < -step) continue;

      // Year label (HUD)
      if (hudAlpha > 0 && zoom > 0.6) {
        const fontSize = Math.max(7, Math.min(11, 9 * zoom));
        ctx.font = `600 ${fontSize}px system-ui, -apple-system, sans-serif`;
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        ctx.globalAlpha = hudAlpha * (row % 10 === 0 ? 0.8 : 0.4);
        ctx.fillStyle = isFocus ? "#666" : "#00d4ff";
        ctx.fillText(`${row}`, labelW - 4 * zoom, y + cell / 2);
        ctx.globalAlpha = 1;
      }

      // Decade glow line
      if (row > 0 && row % 10 === 0 && !isFocus) {
        const lineGrad = ctx.createLinearGradient(labelW, y, labelW + COLS * step, y);
        lineGrad.addColorStop(0, "rgba(0,212,255,0)");
        lineGrad.addColorStop(0.3, "rgba(0,212,255,0.08)");
        lineGrad.addColorStop(0.7, "rgba(0,212,255,0.08)");
        lineGrad.addColorStop(1, "rgba(0,212,255,0)");
        ctx.fillStyle = lineGrad;
        ctx.fillRect(labelW, y - gap, COLS * step, 1);
      }

      for (let col = 0; col < COLS; col++) {
        const x = labelW + col * step;
        if (x + offsetX > w + step || x + offsetX < -step) continue;

        const idx = row * COLS + col;
        const isPast = idx < weeksPassed;
        const isCurrent = idx === weeksPassed;
        const hasDiary = !!diaryEntries[idx.toString()];

        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;

        if (isCurrent) {
          // ── Current week: warm ember with glow ────────────
          const emberPulse = 0.5 + 0.5 * Math.sin(t * 2.5);

          if (!isFocus) {
            ctx.shadowColor = "#ff6b6b";
            ctx.shadowBlur = (12 + 8 * emberPulse) * zoom;
          }
          ctx.fillStyle = isFocus ? "#fff" : `rgba(255, 107, 107, ${0.7 + 0.3 * emberPulse})`;
          ctx.beginPath();
          ctx.roundRect(x, y, cell, cell, 2 * zoom);
          ctx.fill();

          // Inner bright core
          if (!isFocus) {
            ctx.shadowBlur = 0;
            ctx.fillStyle = `rgba(255, 200, 180, ${0.3 + 0.2 * emberPulse})`;
            const inset = cell * 0.25;
            ctx.beginPath();
            ctx.roundRect(x + inset, y + inset, cell - inset * 2, cell - inset * 2, 1);
            ctx.fill();
          }
          ctx.shadowBlur = 0;
        } else if (isPast) {
          // ── Past weeks: volumetric breathing glow ─────────
          const recency = idx / (weeksPassed || 1);
          const intensity = 0.25 + recency * 0.75;

          if (isFocus) {
            ctx.fillStyle = `rgba(255, 255, 255, ${0.15 + intensity * 0.7})`;
          } else {
            // Radial gradient per cell for volumetric feel
            const cx = x + cell / 2;
            const cy = y + cell / 2;
            const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, cell * 0.7);
            const alpha = intensity * breathe;
            grad.addColorStop(0, `rgba(100, 230, 255, ${alpha * 0.9})`);
            grad.addColorStop(0.6, `rgba(0, 180, 220, ${alpha * 0.5})`);
            grad.addColorStop(1, `rgba(0, 100, 140, ${alpha * 0.15})`);
            ctx.fillStyle = grad;

            // Subtle outer glow on recent weeks
            if (recency > 0.9) {
              ctx.shadowColor = "rgba(0, 212, 255, 0.3)";
              ctx.shadowBlur = 4 * zoom * breathe;
            }
          }
          ctx.beginPath();
          ctx.roundRect(x, y, cell, cell, 2 * zoom);
          ctx.fill();
          ctx.shadowBlur = 0;
        } else {
          // ── Future weeks: subtle, respectful ──────────────
          ctx.fillStyle = isFocus ? "#0a0a0a" : "rgba(20, 20, 50, 0.4)";
          ctx.beginPath();
          ctx.roundRect(x, y, cell, cell, 2 * zoom);
          ctx.fill();
          ctx.strokeStyle = isFocus ? "#1a1a1a" : "rgba(60, 60, 100, 0.15)";
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }

        // Diary marker — soft golden dot
        if (hasDiary) {
          const dotR = Math.max(1.5, 2.5 * zoom);
          ctx.beginPath();
          ctx.arc(x + cell / 2, y + cell / 2, dotR, 0, Math.PI * 2);
          ctx.fillStyle = isFocus ? "rgba(255,255,255,0.8)" : "rgba(255, 215, 0, 0.8)";
          ctx.fill();
        }
      }
    }

    ctx.restore();

    // ── Particles (in front of grid for depth) ──────────────
    if (!isFocus) {
      const particles = particlesRef.current;
      for (const p of particles) {
        if (p.life > p.maxLife * 0.7) {
          const alpha = Math.sin((p.life / p.maxLife) * Math.PI) * 0.15;
          ctx.fillStyle = `hsla(${p.hue}, 60%, 80%, ${alpha})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 0.6, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }, [weeksPassed, totalYears, diaryEntries, zoom, offsetX, offsetY, mode, hudVisible]);

  useEffect(() => {
    let running = true;
    function loop(t: number) {
      if (!running) return;
      draw(t);
      rafRef.current = requestAnimationFrame(loop);
    }
    rafRef.current = requestAnimationFrame(loop);
    return () => { running = false; cancelAnimationFrame(rafRef.current); };
  }, [draw]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left - offsetX;
    const my = e.clientY - rect.top - offsetY;

    const cell = BASE_CELL * zoom;
    const gap = GAP * zoom;
    const step = cell + gap;
    const labelW = LABEL_W * zoom;
    const headerH = HEADER_H * zoom;

    const col = Math.floor((mx - labelW) / step);
    const row = Math.floor((my - headerH) / step);

    if (col >= 0 && col < COLS && row >= 0 && row < totalYears) {
      const idx = row * COLS + col;
      if (idx <= weeksPassed) onWeekSelect(idx, row, col);
    }
  }, [zoom, offsetX, offsetY, totalYears, weeksPassed, onWeekSelect]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ touchAction: "none" }}
      onClick={handleClick}
    />
  );
};

export default ResonanceCanvas;
