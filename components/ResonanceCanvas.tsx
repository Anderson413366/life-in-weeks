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

// ── Layout constants ─────────────────────────────────────────
const COLS = 52;
const BASE_CELL = 12;
const BASE_GAP = 4;
const LABEL_W = 28;
const HEADER_H = 18;

// ── Color palette ────────────────────────────────────────────
const ZEN = {
  lived: "#0891b2",
  current: "#ec4899",
  currentGlow: "rgba(236, 72, 153, 0.6)",
  future: "rgba(255, 255, 255, 0.08)",
  futureBorder: "rgba(255, 255, 255, 0.04)",
  diary: "#fbbf24",
  bg: "#080818",
  label: "rgba(0, 212, 255, 0.5)",
  labelBright: "rgba(0, 212, 255, 0.8)",
  decade: "rgba(0, 212, 255, 0.06)",
  header: "rgba(0, 212, 255, 0.4)",
};

const FOCUS = {
  lived: "#ffffff",
  current: "#ffffff",
  currentGlow: "rgba(255, 255, 255, 0.4)",
  future: "rgba(255, 255, 255, 0.05)",
  futureBorder: "rgba(255, 255, 255, 0.03)",
  diary: "#ffffff",
  bg: "#000000",
  label: "rgba(255, 255, 255, 0.3)",
  labelBright: "rgba(255, 255, 255, 0.6)",
  decade: "rgba(255, 255, 255, 0.06)",
  header: "rgba(255, 255, 255, 0.25)",
};

const ResonanceCanvas: React.FC<ResonanceCanvasProps> = ({
  weeksPassed, totalYears, diaryEntries, zoom, offsetX, offsetY, mode, hudVisible, onWeekSelect,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);

  // Store latest props in refs so the RAF loop always reads fresh values
  // without needing to recreate the draw function on every prop change.
  const propsRef = useRef({ weeksPassed, totalYears, diaryEntries, zoom, offsetX, offsetY, mode, hudVisible });
  propsRef.current = { weeksPassed, totalYears, diaryEntries, zoom, offsetX, offsetY, mode, hudVisible };

  // Cached canvas size to avoid expensive resize every frame
  const sizeRef = useRef({ w: 0, h: 0, dpr: 1 });

  // ── Main draw function (called 60× per second) ────────────
  const draw = useCallback((time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const p = propsRef.current;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;

    // Resize canvas buffer only when dimensions change
    if (sizeRef.current.w !== w || sizeRef.current.h !== h || sizeRef.current.dpr !== dpr) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      sizeRef.current = { w, h, dpr };
    }

    // Reset transform and scale for retina
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const C = p.mode === "focus" ? FOCUS : ZEN;
    const t = time / 1000;
    const z = p.zoom;
    const cell = BASE_CELL * z;
    const gap = BASE_GAP * z;
    const step = cell + gap;
    const labelW = LABEL_W * z;
    const headerH = HEADER_H * z;

    // ── Clear ───────────────────────────────────────────────
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, w, h);

    // ── Viewport culling bounds (in grid space) ─────────────
    const vl = -p.offsetX;
    const vr = vl + w;
    const vt = -p.offsetY;
    const vb = vt + h;

    ctx.save();
    ctx.translate(p.offsetX, p.offsetY);

    // ── Week number headers ─────────────────────────────────
    if (p.hudVisible && z > 0.4) {
      const fs = Math.max(6, Math.min(11, 8 * z));
      ctx.font = `600 ${fs}px system-ui, -apple-system, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = C.header;

      for (let c = 0; c < COLS; c++) {
        const cx = labelW + c * step + cell / 2;
        if (cx < vl - step || cx > vr + step) continue;
        ctx.fillText(`${c + 1}`, cx, headerH / 2);
      }
    }

    // ── Rows ────────────────────────────────────────────────
    for (let row = 0; row < p.totalYears; row++) {
      const ry = headerH + row * step;

      // Row-level cull
      if (ry > vb + step) break; // rows below viewport — stop entirely
      if (ry + cell < vt - step) continue; // row above viewport — skip

      // Year label
      if (p.hudVisible && z > 0.4) {
        const fs = Math.max(6, Math.min(11, 8 * z));
        ctx.font = `600 ${fs}px system-ui, -apple-system, sans-serif`;
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        ctx.fillStyle = row % 10 === 0 ? C.labelBright : C.label;
        ctx.fillText(`${row}`, labelW - 3 * z, ry + cell / 2);
      }

      // Decade separator
      if (row > 0 && row % 10 === 0) {
        ctx.fillStyle = C.decade;
        ctx.fillRect(labelW, ry - gap / 2, COLS * step - gap, Math.max(1, 0.5 * z));
      }

      // ── Cells ─────────────────────────────────────────────
      for (let col = 0; col < COLS; col++) {
        const cx = labelW + col * step;

        // Column-level cull
        if (cx > vr + step) break;
        if (cx + cell < vl - step) continue;

        const idx = row * COLS + col;
        const isPast = idx < p.weeksPassed;
        const isCurrent = idx === p.weeksPassed;
        const hasDiary = !!p.diaryEntries[idx.toString()];

        // Reset per-cell state
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;

        if (isCurrent) {
          // ── Current week: glowing ember ─────────────────
          const pulse = p.mode === "focus" ? 1 : 0.7 + 0.3 * Math.sin(t * 2.8);

          if (p.mode !== "focus") {
            ctx.shadowColor = C.currentGlow;
            ctx.shadowBlur = 12 * z;
          }

          ctx.globalAlpha = pulse;
          ctx.fillStyle = C.current;
          ctx.beginPath();
          ctx.roundRect(cx, ry, cell, cell, Math.max(1, 2 * z));
          ctx.fill();

          ctx.shadowBlur = 0;
          ctx.globalAlpha = 1;
        } else if (isPast) {
          // ── Lived weeks: solid, premium ─────────────────
          ctx.fillStyle = C.lived;
          ctx.beginPath();
          ctx.roundRect(cx, ry, cell, cell, Math.max(1, 2 * z));
          ctx.fill();
        } else {
          // ── Future weeks: dim, minimal ──────────────────
          ctx.fillStyle = C.future;
          ctx.beginPath();
          ctx.roundRect(cx, ry, cell, cell, Math.max(1, 2 * z));
          ctx.fill();

          ctx.strokeStyle = C.futureBorder;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }

        // Diary marker
        if (hasDiary) {
          const dr = Math.max(1.5, 2 * z);
          ctx.beginPath();
          ctx.arc(cx + cell / 2, ry + cell / 2, dr, 0, Math.PI * 2);
          ctx.fillStyle = C.diary;
          ctx.globalAlpha = 0.9;
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      }
    }

    ctx.restore();
  }, []); // Empty deps — reads everything from propsRef

  // ── Animation loop ────────────────────────────────────────
  useEffect(() => {
    let active = true;
    function loop(t: number) {
      if (!active) return;
      draw(t);
      rafRef.current = requestAnimationFrame(loop);
    }
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      active = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, [draw]);

  // ── Hit testing ───────────────────────────────────────────
  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const p = propsRef.current;
    const rect = canvas.getBoundingClientRect();

    // Mouse position in canvas space, accounting for zoom + pan offset
    const mx = e.clientX - rect.left - p.offsetX;
    const my = e.clientY - rect.top - p.offsetY;

    const z = p.zoom;
    const cell = BASE_CELL * z;
    const gap = BASE_GAP * z;
    const step = cell + gap;
    const labelW = LABEL_W * z;
    const headerH = HEADER_H * z;

    // Reverse-calculate grid coordinates
    const col = Math.floor((mx - labelW) / step);
    const row = Math.floor((my - headerH) / step);

    // Verify within bounds and verify click is inside the cell (not the gap)
    if (col < 0 || col >= COLS || row < 0 || row >= p.totalYears) return;

    const cellX = labelW + col * step;
    const cellY = headerH + row * step;
    if (mx < cellX || mx > cellX + cell || my < cellY || my > cellY + cell) return;

    const idx = row * COLS + col;
    if (idx <= p.weeksPassed) {
      onWeekSelect(idx, row, col);
    }
  }, [onWeekSelect]);

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
