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

// ── Colors ───────────────────────────────────────────────────
const LIVED = "#0891b2";
const CURRENT = "#ec4899";
const CURRENT_GLOW = "rgba(236, 72, 153, 0.6)";
const FUTURE = "rgba(255, 255, 255, 0.07)";
const FUTURE_STROKE = "rgba(255, 255, 255, 0.15)";
const DIARY_DOT = "#fbbf24";
const BG = "#080818";
const LABEL_COLOR = "rgba(255, 255, 255, 0.35)";
const LABEL_BRIGHT = "rgba(255, 255, 255, 0.5)";
const HEADER_COLOR = "rgba(255, 255, 255, 0.25)";
const SEPARATOR = "rgba(255, 255, 255, 0.06)";

// ── Layout per mode ──────────────────────────────────────────
const WEEKS  = { cols: 52, cell: 12, gap: 4, labelW: 28, headerH: 18 };
const MONTHS = { cols: 36, radius: 10, gap: 6, labelW: 32, headerH: 0 };
const YEARS_L = { cols: 10, size: 28, gap: 14, labelW: 40, headerH: 0 };

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

    const t = time / 1000;
    const z = p.zoom;
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.translate(p.offsetX, p.offsetY);

    if (p.gridMode === "weeks") drawWeeks(ctx, p, t, z, w, h);
    else if (p.gridMode === "months") drawMonths(ctx, p, t, z, w, h);
    else drawYears(ctx, p, t, z, w, h);

    ctx.restore();
  }, []);

  useEffect(() => {
    let active = true;
    function loop(t: number) { if (!active) return; draw(t); rafRef.current = requestAnimationFrame(loop); }
    rafRef.current = requestAnimationFrame(loop);
    return () => { active = false; cancelAnimationFrame(rafRef.current); };
  }, [draw]);

  // ── Hit test ───────────────────────────────────────────────
  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const p = propsRef.current;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left - p.offsetX;
    const my = e.clientY - rect.top - p.offsetY;
    const z = p.zoom;

    if (p.gridMode === "weeks") {
      const { cols, cell, gap, labelW, headerH } = WEEKS;
      const step = (cell + gap) * z;
      const col = Math.floor((mx - labelW * z) / step);
      const row = Math.floor((my - headerH * z) / step);
      if (col >= 0 && col < cols && row >= 0 && row < p.totalYears) {
        const idx = row * cols + col;
        if (idx <= p.weeksPassed) p.onWeekSelect(idx, row, col);
      }
    } else if (p.gridMode === "months") {
      const { cols, radius, gap, labelW } = MONTHS;
      const step = (radius * 2 + gap) * z;
      const col = Math.floor((mx - labelW * z) / step);
      const row = Math.floor(my / step);
      if (col >= 0 && col < cols && row >= 0) {
        const monthIdx = row * cols + col;
        const weekIdx = Math.floor(monthIdx * (52 / 12));
        if (weekIdx <= p.weeksPassed) p.onWeekSelect(weekIdx, Math.floor(weekIdx / 52), weekIdx % 52);
      }
    } else {
      const { cols, size, gap, labelW } = YEARS_L;
      const step = (size + gap) * z;
      const col = Math.floor((mx - labelW * z) / step);
      const row = Math.floor(my / step);
      if (col >= 0 && col < cols && row >= 0) {
        const yearIdx = row * cols + col;
        const weekIdx = yearIdx * 52;
        if (weekIdx <= p.weeksPassed) p.onWeekSelect(weekIdx, yearIdx, 0);
      }
    }
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ touchAction: "none" }} onClick={handleClick} />;
};

// ════════════════════════════════════════════════════════════════
// WEEKS MODE
// ════════════════════════════════════════════════════════════════
function drawWeeks(ctx: CanvasRenderingContext2D, p: typeof ResonanceCanvas extends React.FC<infer P> ? P : never, t: number, z: number, w: number, h: number) {
  const { cols, cell, gap, labelW, headerH } = WEEKS;
  const cz = cell * z, gz = gap * z, step = cz + gz, lw = labelW * z, hh = headerH * z;
  const vl = -p.offsetX, vr = vl + w, vt = -p.offsetY, vb = vt + h;

  // Headers
  if (p.hudVisible && z > 0.4) {
    const fs = Math.max(6, Math.min(11, 8 * z));
    ctx.font = `600 ${fs}px system-ui`;
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillStyle = HEADER_COLOR;
    for (let c = 0; c < cols; c++) {
      const cx = lw + c * step + cz / 2;
      if (cx < vl - step || cx > vr + step) continue;
      ctx.fillText(`${c + 1}`, cx, hh / 2);
    }
  }

  for (let row = 0; row < p.totalYears; row++) {
    const ry = hh + row * step;
    if (ry > vb + step) break;
    if (ry + cz < vt - step) continue;

    if (p.hudVisible && z > 0.4) {
      const fs = Math.max(6, Math.min(11, 8 * z));
      ctx.font = `600 ${fs}px system-ui`;
      ctx.textAlign = "right"; ctx.textBaseline = "middle";
      ctx.fillStyle = row % 10 === 0 ? LABEL_BRIGHT : LABEL_COLOR;
      ctx.fillText(`${row}`, lw - 3 * z, ry + cz / 2);
    }
    if (row > 0 && row % 10 === 0) { ctx.fillStyle = SEPARATOR; ctx.fillRect(lw, ry - gz / 2, cols * step, 1); }

    for (let col = 0; col < cols; col++) {
      const cx = lw + col * step;
      if (cx > vr + step) break;
      if (cx + cz < vl - step) continue;
      const idx = row * cols + col;
      ctx.globalAlpha = 1; ctx.shadowBlur = 0;

      if (idx === p.weeksPassed) {
        const pulse = 0.7 + 0.3 * Math.sin(t * 2.8);
        ctx.shadowColor = CURRENT_GLOW; ctx.shadowBlur = 12 * z; ctx.globalAlpha = pulse;
        ctx.fillStyle = CURRENT;
        ctx.beginPath(); ctx.roundRect(cx, ry, cz, cz, 2); ctx.fill();
        ctx.shadowBlur = 0; ctx.globalAlpha = 1;
      } else if (idx < p.weeksPassed) {
        ctx.fillStyle = LIVED;
        ctx.beginPath(); ctx.roundRect(cx, ry, cz, cz, 2); ctx.fill();
      } else {
        ctx.fillStyle = FUTURE;
        ctx.beginPath(); ctx.roundRect(cx, ry, cz, cz, 2); ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.04)"; ctx.lineWidth = 0.5; ctx.stroke();
      }
      if (p.diaryEntries[idx.toString()]) {
        ctx.beginPath(); ctx.arc(cx + cz / 2, ry + cz / 2, Math.max(1.5, 2 * z), 0, Math.PI * 2);
        ctx.fillStyle = DIARY_DOT; ctx.globalAlpha = 0.9; ctx.fill(); ctx.globalAlpha = 1;
      }
    }
  }
}

// ════════════════════════════════════════════════════════════════
// MONTHS MODE (circles)
// ════════════════════════════════════════════════════════════════
function drawMonths(ctx: CanvasRenderingContext2D, p: any, _t: number, z: number, _w: number, _h: number) {
  const { cols, radius, gap, labelW } = MONTHS;
  const rz = radius * z, gz = gap * z, step = rz * 2 + gz, lw = labelW * z;
  const monthsPassed = Math.floor(p.weeksPassed / (52 / 12));
  const totalMonths = p.totalYears * 12;
  const totalRows = Math.ceil(totalMonths / cols);

  for (let row = 0; row < totalRows; row++) {
    const ry = row * step + rz;

    // Year boundary separator every 12 months (4 rows of 36 = 12 months per ~0.33 rows... actually 36 cols means 3 years per row)
    // Every row = 36 months = 3 years. So year boundary every 1/3 row → every 4 rows = 1 year boundary at row multiples
    if (row > 0 && row % 1 === 0) {
      // Every row is 3 years. Label every row.
      const yearNum = row * 3;
      if (yearNum <= p.totalYears && p.hudVisible) {
        ctx.font = `500 ${Math.max(7, 9 * z)}px system-ui`;
        ctx.textAlign = "right"; ctx.textBaseline = "middle";
        ctx.fillStyle = LABEL_COLOR;
        ctx.fillText(`${yearNum}`, lw - 4 * z, ry);
      }
    }

    for (let col = 0; col < cols; col++) {
      const monthIdx = row * cols + col;
      if (monthIdx >= totalMonths) break;
      const cx = lw + col * step + rz;

      ctx.globalAlpha = 1; ctx.shadowBlur = 0;

      if (monthIdx === monthsPassed) {
        ctx.shadowColor = CURRENT_GLOW; ctx.shadowBlur = 15 * z;
        ctx.fillStyle = CURRENT;
        ctx.beginPath(); ctx.arc(cx, ry, rz, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
      } else if (monthIdx < monthsPassed) {
        ctx.fillStyle = LIVED;
        ctx.beginPath(); ctx.arc(cx, ry, rz, 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.strokeStyle = FUTURE_STROKE; ctx.lineWidth = 1.5 * z;
        ctx.beginPath(); ctx.arc(cx, ry, rz, 0, Math.PI * 2); ctx.stroke();
      }
    }
  }
}

// ════════════════════════════════════════════════════════════════
// YEARS MODE (diamonds)
// ════════════════════════════════════════════════════════════════
function drawYears(ctx: CanvasRenderingContext2D, p: any, _t: number, z: number, _w: number, _h: number) {
  const { cols, size, gap, labelW } = YEARS_L;
  const sz = size * z, gz = gap * z, step = sz + gz, lw = labelW * z;
  const yearsPassed = Math.floor(p.weeksPassed / 52);
  const totalRows = Math.ceil(p.totalYears / cols);
  const half = sz / 2;

  for (let row = 0; row < totalRows; row++) {
    const ry = row * step + half + gz;

    // Decade label
    if (p.hudVisible) {
      const decade = row * cols;
      ctx.font = `600 ${Math.max(8, 11 * z)}px system-ui`;
      ctx.textAlign = "right"; ctx.textBaseline = "middle";
      ctx.fillStyle = LABEL_BRIGHT;
      ctx.fillText(`${decade}s`, lw - 6 * z, ry);
    }

    for (let col = 0; col < cols; col++) {
      const yearIdx = row * cols + col;
      if (yearIdx >= p.totalYears) break;
      const cx = lw + col * step + half;

      ctx.globalAlpha = 1; ctx.shadowBlur = 0;
      ctx.save();
      ctx.translate(cx, ry);
      ctx.rotate(Math.PI / 4);

      if (yearIdx === yearsPassed) {
        ctx.shadowColor = CURRENT_GLOW; ctx.shadowBlur = 20 * z;
        ctx.fillStyle = CURRENT;
        ctx.fillRect(-half, -half, sz, sz);
        ctx.shadowBlur = 0;
      } else if (yearIdx < yearsPassed) {
        ctx.fillStyle = LIVED;
        ctx.fillRect(-half, -half, sz, sz);
      } else {
        ctx.strokeStyle = "rgba(255,255,255,0.2)"; ctx.lineWidth = 2 * z;
        ctx.strokeRect(-half, -half, sz, sz);
      }

      ctx.restore();
    }
  }
}

export default ResonanceCanvas;
