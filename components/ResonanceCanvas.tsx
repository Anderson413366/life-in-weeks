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
const BASE_CELL = 14;
const GAP = 2;
const LABEL_W = 28;
const HEADER_H = 16;

// Colors
const ZEN = {
  past: "#00d4ff",
  pastDim: "#006880",
  current: "#ff6b6b",
  future: "#1a1a3a",
  futureBorder: "#2a2a4e",
  diary: "#ffd700",
  decade: "#ffd70060",
  bg: "#0a0a23",
  label: "#5a5a7a",
  header: "#00d4ff80",
};

const FOCUS = {
  past: "#ffffff",
  pastDim: "#888888",
  current: "#ffffff",
  future: "#1a1a1a",
  futureBorder: "#333333",
  diary: "#ffffff",
  decade: "#ffffff40",
  bg: "#000000",
  label: "#666666",
  header: "#888888",
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

    const colors = mode === "focus" ? FOCUS : ZEN;
    const cell = BASE_CELL * zoom;
    const gap = GAP * zoom;
    const step = cell + gap;
    const labelW = LABEL_W * zoom;
    const headerH = HEADER_H * zoom;
    const time = timeRef.current;

    // Background
    ctx.fillStyle = colors.bg;
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.translate(offsetX, offsetY);

    // Header labels (week numbers) — only at zoom > 1.2
    if (zoom > 1.2) {
      ctx.font = `${Math.min(10 * zoom, 14)}px system-ui`;
      ctx.fillStyle = colors.header;
      ctx.textAlign = "center";
      for (let c = 0; c < COLS; c++) {
        const x = labelW + c * step + cell / 2;
        if (x + offsetX > -step && x + offsetX < w + step) {
          ctx.fillText(`${c + 1}`, x, headerH - 2 * zoom);
        }
      }
    }

    // Rows
    for (let row = 0; row < totalYears; row++) {
      const y = headerH + row * step;

      // Cull off-screen rows
      if (y + offsetY > h + step || y + offsetY < -step) continue;

      // Year label — only at zoom > 1.0
      if (zoom > 1.0) {
        ctx.font = `${Math.min(10 * zoom, 13)}px system-ui`;
        ctx.fillStyle = colors.label;
        ctx.textAlign = "right";
        ctx.fillText(`${row}`, labelW - 4 * zoom, y + cell * 0.8);
      }

      // Decade marker
      if (row > 0 && row % 10 === 0) {
        ctx.fillStyle = colors.decade;
        ctx.fillRect(labelW - 2 * zoom, y, 1 * zoom, cell);
      }

      for (let col = 0; col < COLS; col++) {
        const x = labelW + col * step;

        // Cull off-screen cols
        if (x + offsetX > w + step || x + offsetX < -step) continue;

        const idx = row * COLS + col;
        const isPast = idx < weeksPassed;
        const isCurrent = idx === weeksPassed;
        const hasDiary = !!diaryEntries[idx.toString()];

        if (isCurrent) {
          // Pulsing current week
          const pulse = mode === "focus" ? 1 : 0.6 + 0.4 * Math.sin(time * 3);
          ctx.globalAlpha = pulse;
          ctx.fillStyle = colors.current;
          ctx.fillRect(x, y, cell, cell);
          ctx.globalAlpha = 1;

          // Glow in zen mode
          if (mode === "zen") {
            ctx.shadowColor = colors.current;
            ctx.shadowBlur = 8 * zoom;
            ctx.fillStyle = colors.current;
            ctx.fillRect(x, y, cell, cell);
            ctx.shadowBlur = 0;
          }
        } else if (isPast) {
          // Past week — intensity based on recency
          const recency = Math.max(0.3, 1 - (weeksPassed - idx) / (weeksPassed || 1));
          ctx.fillStyle = mode === "zen"
            ? `rgba(0, 212, 255, ${0.3 + recency * 0.7})`
            : `rgba(255, 255, 255, ${0.2 + recency * 0.8})`;
          ctx.fillRect(x, y, cell, cell);
        } else {
          // Future week
          ctx.fillStyle = colors.future;
          ctx.fillRect(x, y, cell, cell);
          ctx.strokeStyle = colors.futureBorder;
          ctx.lineWidth = 0.5;
          ctx.strokeRect(x, y, cell, cell);
        }

        // Diary marker
        if (hasDiary) {
          const dotR = Math.max(1.5, 2 * zoom);
          ctx.beginPath();
          ctx.arc(x + cell / 2, y + cell / 2, dotR, 0, Math.PI * 2);
          ctx.fillStyle = colors.diary;
          ctx.fill();
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
