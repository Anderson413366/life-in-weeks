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
  onWeekSelect: (weekIndex: number, row: number, col: number) => void;
}

const COLS = 52;
const BASE_CELL = 18;
const GAP = 2;
const LABEL_W = 32;
const HEADER_H = 22;

const ZEN = {
  past: "#00d4ff",
  current: "#ff6b6b",
  future: "#1f1f3a",
  futureBorder: "#3a3a5e",
  diary: "#ffd700",
  decade: "#ffd70080",
  bg: "#0a0a23",
  label: "#00d4ff",
  labelDim: "#00d4ff90",
  header: "#00d4ff",
  headerBg: "rgba(0,0,0,0.15)",
};

const FOCUS = {
  past: "#ffffff",
  current: "#ffffff",
  future: "#1a1a1a",
  futureBorder: "#333333",
  diary: "#ffffff",
  decade: "#ffffff50",
  bg: "#000000",
  label: "#888888",
  labelDim: "#666666",
  header: "#aaaaaa",
  headerBg: "rgba(255,255,255,0.03)",
};

const ResonanceCanvas: React.FC<ResonanceCanvasProps> = ({
  weeksPassed, totalYears, diaryEntries, zoom, offsetX, offsetY, mode, onWeekSelect,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const timeRef = useRef(0);

  const draw = useCallback(() => {
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

    const C = mode === "focus" ? FOCUS : ZEN;
    const cell = BASE_CELL * zoom;
    const gap = GAP * zoom;
    const step = cell + gap;
    const labelW = LABEL_W * zoom;
    const headerH = HEADER_H * zoom;
    const time = timeRef.current;
    const fontSize = Math.max(8, Math.min(12, 10 * zoom));

    // Background
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.translate(offsetX, offsetY);

    // ── Header row: week numbers 1–52 ──────────────────────
    ctx.font = `600 ${fontSize}px system-ui, -apple-system, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (let c = 0; c < COLS; c++) {
      const x = labelW + c * step;
      const cx = x + cell / 2;

      // Skip if off-screen
      if (cx + offsetX < -step || cx + offsetX > w + step) continue;

      // Background pill
      ctx.fillStyle = C.headerBg;
      ctx.beginPath();
      ctx.roundRect(x, 0, cell, headerH - 2 * zoom, 2);
      ctx.fill();

      // Number
      ctx.fillStyle = C.header;
      ctx.fillText(`${c + 1}`, cx, (headerH - 2 * zoom) / 2);
    }

    // ── Year rows ──────────────────────────────────────────
    for (let row = 0; row < totalYears; row++) {
      const y = headerH + row * step;

      // Cull off-screen rows
      if (y + offsetY > h + step) continue;
      if (y + offsetY + cell < -step) continue;

      // Year label
      ctx.font = `600 ${fontSize}px system-ui, -apple-system, sans-serif`;
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillStyle = row % 10 === 0 ? C.label : C.labelDim;
      ctx.fillText(`${row}`, labelW - 4 * zoom, y + cell / 2);

      // Decade marker line
      if (row > 0 && row % 10 === 0) {
        ctx.fillStyle = C.decade;
        ctx.fillRect(labelW, y - gap / 2, COLS * step - gap, 1);
      }

      // Week cells
      for (let col = 0; col < COLS; col++) {
        const x = labelW + col * step;

        // Cull off-screen cols
        if (x + offsetX > w + step || x + offsetX < -step) continue;

        const idx = row * COLS + col;
        const isPast = idx < weeksPassed;
        const isCurrent = idx === weeksPassed;
        const hasDiary = !!diaryEntries[idx.toString()];

        // Reset shadow
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;

        if (isCurrent) {
          // Pulsing current week
          const pulse = mode === "focus" ? 1 : 0.6 + 0.4 * Math.sin(time * 3);
          ctx.globalAlpha = pulse;

          if (mode === "zen") {
            ctx.shadowColor = C.current;
            ctx.shadowBlur = 10 * zoom;
          }
          ctx.fillStyle = C.current;
          ctx.beginPath();
          ctx.roundRect(x, y, cell, cell, 2);
          ctx.fill();
          ctx.shadowBlur = 0;
          ctx.globalAlpha = 1;
        } else if (isPast) {
          // Past week — subtle intensity gradient
          const intensity = Math.max(0.4, Math.min(1, 0.4 + (idx / (weeksPassed || 1)) * 0.6));
          if (mode === "zen") {
            ctx.fillStyle = `rgba(0, 212, 255, ${intensity})`;
          } else {
            ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + intensity * 0.7})`;
          }
          ctx.beginPath();
          ctx.roundRect(x, y, cell, cell, 2);
          ctx.fill();
        } else {
          // Future week
          ctx.fillStyle = C.future;
          ctx.beginPath();
          ctx.roundRect(x, y, cell, cell, 2);
          ctx.fill();
          ctx.strokeStyle = C.futureBorder;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }

        // Diary dot
        if (hasDiary) {
          const dotR = Math.max(2, 2.5 * zoom);
          ctx.beginPath();
          ctx.arc(x + cell / 2, y + cell / 2, dotR, 0, Math.PI * 2);
          ctx.fillStyle = C.diary;
          ctx.globalAlpha = 0.85;
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      }
    }

    ctx.restore();
  }, [weeksPassed, totalYears, diaryEntries, zoom, offsetX, offsetY, mode]);

  // Animation loop
  useEffect(() => {
    let running = true;
    function loop(t: number) {
      if (!running) return;
      timeRef.current = t / 1000;
      draw();
      rafRef.current = requestAnimationFrame(loop);
    }
    rafRef.current = requestAnimationFrame(loop);
    return () => { running = false; cancelAnimationFrame(rafRef.current); };
  }, [draw]);

  // Click handler
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
      if (idx <= weeksPassed) {
        onWeekSelect(idx, row, col);
      }
    }
  }, [zoom, offsetX, offsetY, totalYears, weeksPassed, onWeekSelect]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full cursor-crosshair"
      onClick={handleClick}
    />
  );
};

export default ResonanceCanvas;
