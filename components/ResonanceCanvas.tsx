import React, { useRef, useEffect, useCallback } from "react";
import type { DiaryMap } from "../types";
import type { AppMode } from "../lib/theme";

export type GridMode = "weeks" | "months" | "years";

interface ResonanceCanvasProps {
  weeksPassed: number;
  totalYears: number;
  diaryEntries: DiaryMap;
  zoom: number;
  offsetX: number;
  offsetY: number;
  mode: AppMode;
  gridMode: GridMode;
  hudVisible: boolean;
  onWeekSelect: (weekIndex: number, row: number, col: number) => void;
}

// ── Mode-specific colors ─────────────────────────────────────
const C_WEEKS  = { lived: "#00d4ff", current: "#ec4899", glow: "rgba(236,72,153,0.6)", future: "rgba(255,255,255,0.09)", futureStroke: "rgba(255,255,255,0.18)", diary: "#fbbf24" };
const C_MONTHS = { lived: "#00ff9d", current: "#ff9500", glow: "rgba(255,149,0,0.6)", future: "transparent", futureStroke: "rgba(0,255,157,0.2)" };
const C_YEARS  = { lived: "#bf5fff", current: "#ffd700", glow: "rgba(255,215,0,0.6)", future: "transparent", futureStroke: "rgba(191,95,255,0.25)" };

const BG = "#080818";
const LABEL = "rgba(255,255,255,0.35)";
const LABEL_BRIGHT = "rgba(255,255,255,0.55)";
const HEADER_C = "rgba(255,255,255,0.25)";
const SEP = "rgba(255,255,255,0.06)";

// ── Layout constants ─────────────────────────────────────────
const W_CELL = 14, W_GAP = 3, W_COLS = 52, W_LBL = 28, W_HDR = 18;
const M_RAD = 12, M_GAP = 5, M_COLS = 12, M_LBL = 32;
const Y_SIZE = 42, Y_GAP = 16, Y_COLS = 10, Y_LBL = 44;

export function getGridColors(gm: GridMode) {
  return gm === "weeks" ? { lived: C_WEEKS.lived, current: C_WEEKS.current }
       : gm === "months" ? { lived: C_MONTHS.lived, current: C_MONTHS.current }
       : { lived: C_YEARS.lived, current: C_YEARS.current };
}

const ResonanceCanvas: React.FC<ResonanceCanvasProps> = (props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);
  const propsRef = useRef(props);
  propsRef.current = props;
  const sizeRef = useRef({ w: 0, h: 0, dpr: 1 });

  const draw = useCallback((time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const p = propsRef.current;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (sizeRef.current.w !== w || sizeRef.current.h !== h || sizeRef.current.dpr !== dpr) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      sizeRef.current = { w, h, dpr };
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.translate(p.offsetX, p.offsetY);

    if (p.gridMode === "weeks") drawWeeks(ctx, p, time / 1000, p.zoom, w);
    else if (p.gridMode === "months") drawMonths(ctx, p, time / 1000, p.zoom, w);
    else drawYears(ctx, p, time / 1000, p.zoom, w);

    ctx.restore();
  }, []);

  useEffect(() => {
    let active = true;
    const loop = (t: number) => { if (!active) return; draw(t); rafRef.current = requestAnimationFrame(loop); };
    rafRef.current = requestAnimationFrame(loop);
    return () => { active = false; cancelAnimationFrame(rafRef.current); };
  }, [draw]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const p = propsRef.current;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left - p.offsetX;
    const my = e.clientY - rect.top - p.offsetY;
    const z = p.zoom;
    const w = canvas.clientWidth;

    if (p.gridMode === "weeks") {
      const cz = W_CELL * z, gz = W_GAP * z, step = cz + gz, lw = W_LBL * z, hh = W_HDR * z;
      const tw = lw + W_COLS * step;
      const cx0 = Math.max(16, (w - tw) / 2);
      const col = Math.floor((mx - cx0 - lw) / step);
      const row = Math.floor((my - hh) / step);
      if (col >= 0 && col < W_COLS && row >= 0 && row < p.totalYears) {
        const idx = row * W_COLS + col;
        if (idx <= p.weeksPassed) p.onWeekSelect(idx, row, col);
      }
    } else if (p.gridMode === "months") {
      const rz = M_RAD * z, gz = M_GAP * z, step = rz * 2 + gz, lw = M_LBL * z;
      const tw = lw + M_COLS * step;
      const cx0 = Math.max(16, (w - tw) / 2);
      const col = Math.floor((mx - cx0 - lw) / step);
      const row = Math.floor(my / step);
      if (col >= 0 && col < M_COLS && row >= 0) {
        const monthIdx = row * M_COLS + col;
        const weekIdx = Math.floor(monthIdx * (52 / 12));
        if (weekIdx <= p.weeksPassed) p.onWeekSelect(weekIdx, Math.floor(weekIdx / 52), weekIdx % 52);
      }
    } else {
      const sz = Y_SIZE * z, gz = Y_GAP * z, step = sz + gz, lw = Y_LBL * z;
      const tw = lw + Y_COLS * step;
      const cx0 = Math.max(16, (w - tw) / 2);
      const col = Math.floor((mx - cx0 - lw) / step);
      const row = Math.floor(my / step);
      if (col >= 0 && col < Y_COLS && row >= 0) {
        const yearIdx = row * Y_COLS + col;
        const weekIdx = yearIdx * 52;
        if (weekIdx <= p.weeksPassed) p.onWeekSelect(weekIdx, yearIdx, 0);
      }
    }
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ touchAction: "none" }} onClick={handleClick} />;
};

// ════ WEEKS ═══════════════════════════════════════════════════
function drawWeeks(ctx: CanvasRenderingContext2D, p: any, t: number, z: number, cw: number) {
  const C = C_WEEKS;
  const cz = W_CELL * z, gz = W_GAP * z, step = cz + gz, lw = W_LBL * z, hh = W_HDR * z;
  const tw = lw + W_COLS * step;
  const cx0 = Math.max(16, (cw - tw) / 2);

  if (p.hudVisible && z > 0.35) {
    const fs = Math.max(6, Math.min(12, 9 * z));
    ctx.font = `600 ${fs}px system-ui`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = HEADER_C;
    for (let c = 0; c < W_COLS; c++) ctx.fillText(`${c + 1}`, cx0 + lw + c * step + cz / 2, hh / 2);
  }

  for (let row = 0; row < p.totalYears; row++) {
    const ry = hh + row * step;
    if (p.hudVisible && z > 0.35) {
      const fs = Math.max(6, Math.min(12, 9 * z));
      ctx.font = `600 ${fs}px system-ui`; ctx.textAlign = "right"; ctx.textBaseline = "middle";
      ctx.fillStyle = row % 10 === 0 ? LABEL_BRIGHT : LABEL;
      ctx.fillText(`${row}`, cx0 + lw - 3 * z, ry + cz / 2);
    }
    if (row > 0 && row % 10 === 0) { ctx.fillStyle = SEP; ctx.fillRect(cx0 + lw, ry - gz / 2, W_COLS * step, 1); }

    for (let col = 0; col < W_COLS; col++) {
      const cx = cx0 + lw + col * step;
      const idx = row * W_COLS + col;
      ctx.globalAlpha = 1; ctx.shadowBlur = 0;

      if (idx === p.weeksPassed) {
        ctx.shadowColor = C.glow; ctx.shadowBlur = 12 * z; ctx.globalAlpha = 0.7 + 0.3 * Math.sin(t * 2.8);
        ctx.fillStyle = C.current; ctx.beginPath(); ctx.roundRect(cx, ry, cz, cz, 2); ctx.fill();
        ctx.shadowBlur = 0; ctx.globalAlpha = 1;
      } else if (idx < p.weeksPassed) {
        ctx.fillStyle = C.lived; ctx.beginPath(); ctx.roundRect(cx, ry, cz, cz, 2); ctx.fill();
      } else {
        ctx.fillStyle = C.future; ctx.beginPath(); ctx.roundRect(cx, ry, cz, cz, 2); ctx.fill();
        ctx.strokeStyle = C.futureStroke; ctx.lineWidth = 0.5; ctx.stroke();
      }
      if (p.diaryEntries[idx.toString()]) {
        ctx.beginPath(); ctx.arc(cx + cz / 2, ry + cz / 2, Math.max(1.5, 2 * z), 0, Math.PI * 2);
        ctx.fillStyle = C.diary; ctx.globalAlpha = 0.9; ctx.fill(); ctx.globalAlpha = 1;
      }
    }
  }
}

// ════ MONTHS (circles, 12 cols × 90 rows) ════════════════════
function drawMonths(ctx: CanvasRenderingContext2D, p: any, t: number, z: number, cw: number) {
  const C = C_MONTHS;
  const rz = M_RAD * z, gz = M_GAP * z, step = rz * 2 + gz, lw = M_LBL * z;
  const tw = lw + M_COLS * step;
  const cx0 = Math.max(16, (cw - tw) / 2);
  const monthsPassed = Math.floor(p.weeksPassed / (52 / 12));

  for (let row = 0; row < p.totalYears; row++) {
    const ry = row * step + rz + 4 * z;

    if (p.hudVisible) {
      ctx.font = `500 ${Math.max(7, 10 * z)}px system-ui`; ctx.textAlign = "right"; ctx.textBaseline = "middle";
      ctx.fillStyle = row % 10 === 0 ? LABEL_BRIGHT : LABEL;
      ctx.fillText(`${row}`, cx0 + lw - 4 * z, ry);
    }
    if (row > 0 && row % 10 === 0) { ctx.fillStyle = SEP; ctx.fillRect(cx0 + lw, ry - rz, M_COLS * step, 1); }

    for (let col = 0; col < M_COLS; col++) {
      const monthIdx = row * M_COLS + col;
      if (monthIdx >= p.totalYears * 12) break;
      const cx = cx0 + lw + col * step + rz;
      ctx.globalAlpha = 1; ctx.shadowBlur = 0;

      if (monthIdx === monthsPassed) {
        ctx.shadowColor = C.glow; ctx.shadowBlur = 15 * z; ctx.globalAlpha = 0.7 + 0.3 * Math.sin(t * 2.5);
        ctx.fillStyle = C.current; ctx.beginPath(); ctx.arc(cx, ry, rz, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0; ctx.globalAlpha = 1;
      } else if (monthIdx < monthsPassed) {
        ctx.fillStyle = C.lived; ctx.beginPath(); ctx.arc(cx, ry, rz, 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.strokeStyle = C.futureStroke; ctx.lineWidth = 1.5 * z;
        ctx.beginPath(); ctx.arc(cx, ry, rz, 0, Math.PI * 2); ctx.stroke();
      }
    }
  }
}

// ════ YEARS (diamonds, 10 cols × 9 rows) ═════════════════════
function drawYears(ctx: CanvasRenderingContext2D, p: any, t: number, z: number, cw: number) {
  const C = C_YEARS;
  const sz = Y_SIZE * z, gz = Y_GAP * z, step = sz + gz, lw = Y_LBL * z, half = sz / 2;
  const tw = lw + Y_COLS * step;
  const cx0 = Math.max(16, (cw - tw) / 2);
  const yearsPassed = Math.floor(p.weeksPassed / 52);
  const totalRows = Math.ceil(p.totalYears / Y_COLS);

  for (let row = 0; row < totalRows; row++) {
    const ry = row * step + half + 4 * z;

    if (p.hudVisible) {
      ctx.font = `600 ${Math.max(9, 12 * z)}px system-ui`; ctx.textAlign = "right"; ctx.textBaseline = "middle";
      ctx.fillStyle = LABEL_BRIGHT;
      ctx.fillText(`${row * Y_COLS}s`, cx0 + lw - 6 * z, ry);
    }

    for (let col = 0; col < Y_COLS; col++) {
      const yearIdx = row * Y_COLS + col;
      if (yearIdx >= p.totalYears) break;
      const cx = cx0 + lw + col * step + half;
      ctx.globalAlpha = 1; ctx.shadowBlur = 0;

      ctx.save(); ctx.translate(cx, ry); ctx.rotate(Math.PI / 4);
      if (yearIdx === yearsPassed) {
        ctx.shadowColor = C.glow; ctx.shadowBlur = 20 * z; ctx.globalAlpha = 0.7 + 0.3 * Math.sin(t * 2);
        ctx.fillStyle = C.current; ctx.fillRect(-half, -half, sz, sz);
        ctx.shadowBlur = 0; ctx.globalAlpha = 1;
      } else if (yearIdx < yearsPassed) {
        ctx.fillStyle = C.lived; ctx.fillRect(-half, -half, sz, sz);
      } else {
        ctx.strokeStyle = C.futureStroke; ctx.lineWidth = 2 * z;
        ctx.strokeRect(-half, -half, sz, sz);
      }
      ctx.restore();
    }
  }
}

export default ResonanceCanvas;
