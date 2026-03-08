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

const ResonanceCanvas: React.FC<ResonanceCanvasProps> = ({
  weeksPassed, totalYears, diaryEntries, zoom, offsetX, offsetY, mode, hudVisible, onWeekSelect,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const sizeRef = useRef({ w: 0, h: 0 });

  const draw = useCallback((time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    // Only resize canvas when container size actually changes
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (sizeRef.current.w !== w || sizeRef.current.h !== h) {
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      sizeRef.current = { w, h };
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const t = time / 1000;
    const isFocus = mode === "focus";
    const cell = BASE_CELL * zoom;
    const gap = GAP * zoom;
    const step = cell + gap;
    const labelW = LABEL_W * zoom;
    const headerH = HEADER_H * zoom;

    // ── Background (flat fill — no gradient per frame) ──────
    ctx.fillStyle = isFocus ? "#000000" : "#080818";
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.translate(offsetX, offsetY);

    // ── Breathing pulse (subtle) ────────────────────────────
    const breathe = isFocus ? 1 : 0.92 + 0.08 * Math.sin(t * 0.8);

    // ── Viewport culling bounds ─────────────────────────────
    const viewLeft = -offsetX - step;
    const viewRight = -offsetX + w + step;
    const viewTop = -offsetY - step;
    const viewBottom = -offsetY + h + step;

    // ── HUD: Week header numbers ────────────────────────────
    if (hudVisible && zoom > 0.5) {
      const fontSize = Math.max(7, Math.min(12, 9 * zoom));
      ctx.font = `600 ${fontSize}px system-ui, -apple-system, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = isFocus ? "#666" : "#00d4ff80";

      for (let c = 0; c < COLS; c++) {
        const cx = labelW + c * step + cell / 2;
        if (cx < viewLeft || cx > viewRight) continue;
        ctx.fillText(`${c + 1}`, cx, headerH / 2);
      }
    }

    // ── Grid rows ───────────────────────────────────────────
    for (let row = 0; row < totalYears; row++) {
      const y = headerH + row * step;

      // Row-level culling
      if (y > viewBottom || y + cell < viewTop) continue;

      // Year label
      if (hudVisible && zoom > 0.5) {
        const fontSize = Math.max(7, Math.min(12, 9 * zoom));
        ctx.font = `600 ${fontSize}px system-ui, -apple-system, sans-serif`;
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        ctx.fillStyle = isFocus ? (row % 10 === 0 ? "#aaa" : "#555") : (row % 10 === 0 ? "#00d4ff" : "#00d4ff60");
        ctx.fillText(`${row}`, labelW - 4 * zoom, y + cell / 2);
      }

      // Decade line
      if (row > 0 && row % 10 === 0) {
        ctx.fillStyle = isFocus ? "#222" : "rgba(0,212,255,0.06)";
        ctx.fillRect(labelW, y - gap / 2, COLS * step, 1);
      }

      for (let col = 0; col < COLS; col++) {
        const x = labelW + col * step;

        // Cell-level culling
        if (x > viewRight || x + cell < viewLeft) continue;

        const idx = row * COLS + col;
        const isPast = idx < weeksPassed;
        const isCurrent = idx === weeksPassed;
        const hasDiary = !!diaryEntries[idx.toString()];

        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;

        if (isCurrent) {
          // ── Current week: bright ember ─────────────────────
          const pulse = isFocus ? 1 : 0.7 + 0.3 * Math.sin(t * 2.5);

          if (!isFocus) {
            ctx.shadowColor = "#ff6b6b";
            ctx.shadowBlur = 10 * zoom;
          }
          ctx.globalAlpha = pulse;
          ctx.fillStyle = isFocus ? "#ffffff" : "#ff6b6b";
          ctx.beginPath();
          ctx.roundRect(x, y, cell, cell, 2);
          ctx.fill();
          ctx.shadowBlur = 0;
          ctx.globalAlpha = 1;
        } else if (isPast) {
          // ── Lived weeks: CRISP, high-contrast ─────────────
          // Recency = brighter. No foggy alphas.
          const recency = idx / (weeksPassed || 1);

          if (isFocus) {
            // Focus: clean white, slight gradient
            ctx.fillStyle = `rgba(255,255,255,${0.4 + recency * 0.6})`;
          } else {
            // Zen: vivid cyan, no murky alpha
            const r = Math.round(0 + recency * 60);
            const g = Math.round(140 + recency * 80);
            const b = Math.round(180 + recency * 75);
            const a = (0.5 + recency * 0.5) * breathe;
            ctx.fillStyle = `rgba(${r},${g},${b},${a})`;
          }
          ctx.beginPath();
          ctx.roundRect(x, y, cell, cell, 2);
          ctx.fill();
        } else {
          // ── Future: dark, clean ────────────────────────────
          ctx.fillStyle = isFocus ? "#0c0c0c" : "#12122a";
          ctx.beginPath();
          ctx.roundRect(x, y, cell, cell, 2);
          ctx.fill();
          ctx.strokeStyle = isFocus ? "#1a1a1a" : "#1f1f40";
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }

        // Diary dot
        if (hasDiary) {
          const r = Math.max(1.5, 2.5 * zoom);
          ctx.beginPath();
          ctx.arc(x + cell / 2, y + cell / 2, r, 0, Math.PI * 2);
          ctx.fillStyle = isFocus ? "#fff" : "#ffd700";
          ctx.globalAlpha = 0.9;
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      }
    }

    ctx.restore();
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
