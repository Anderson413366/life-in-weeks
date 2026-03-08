import React, { useRef, useEffect, useCallback } from "react";
import type { DiaryMap } from "../types";
import type { AppMode } from "../lib/theme";

export type GridMode = "weeks" | "months" | "years";

interface ResonanceCanvasProps {
  weeksPassed: number;
  totalYears: number;
  birthYear: number;
  diaryEntries: DiaryMap;
  zoom: number;
  offsetX: number;
  offsetY: number;
  mode: AppMode;
  gridMode: GridMode;
  hudVisible: boolean;
  onWeekSelect: (weekIndex: number, row: number, col: number) => void;
}

interface ModeConfig {
  cols: number;
  rows: number;
  cell: number;
  gap: number;
  colorLived: string;
  colorCurrent: string;
  colorGlow: string;
  colorFuture: string;
  colorFutureStroke: string;
  totalUnits: number;
  unitsPassed: number;
  labelEvery: number;
  labelMultiplier: number;
  showYearInCell: boolean;
  birthYear: number;
}

export function getGridColors(gm: GridMode) {
  if (gm === "months") return { lived: "#00ff9d", current: "#ff6b00" };
  if (gm === "years") return { lived: "#bf5fff", current: "#ffd700" };
  return { lived: "#00d4ff", current: "#ec4899" };
}

const BG = "#080818";
const LABEL_BASE = 36;
const TOP_PAD_BASE = 8;

function buildConfig(p: { weeksPassed: number; totalYears: number; birthYear: number }, gm: GridMode): ModeConfig {
  const base = { birthYear: p.birthYear, showYearInCell: false };
  if (gm === "months") {
    return {
      ...base,
      cols: 12, rows: p.totalYears, cell: 18, gap: 3,
      colorLived: "#00ff9d", colorCurrent: "#ff6b00", colorGlow: "rgba(255,107,0,0.7)",
      colorFuture: "rgba(0,255,157,0.07)", colorFutureStroke: "rgba(0,255,157,0.25)",
      totalUnits: p.totalYears * 12, unitsPassed: Math.floor(p.weeksPassed * 12 / 52),
      labelEvery: 1, labelMultiplier: 1,
    };
  }
  if (gm === "years") {
    return {
      ...base,
      cols: 10, rows: Math.ceil(p.totalYears / 10), cell: 40, gap: 4,
      colorLived: "#bf5fff", colorCurrent: "#ffd700", colorGlow: "rgba(255,215,0,0.7)",
      colorFuture: "rgba(191,95,255,0.08)", colorFutureStroke: "rgba(191,95,255,0.35)",
      totalUnits: p.totalYears, unitsPassed: Math.floor(p.weeksPassed / 52),
      labelEvery: 1, labelMultiplier: 10,
      showYearInCell: true,
    };
  }
  // weeks — smaller cells so full grid is visible
  return {
    ...base,
    cols: 52, rows: p.totalYears, cell: 10, gap: 2,
    colorLived: "#00d4ff", colorCurrent: "#ec4899", colorGlow: "rgba(236,72,153,0.7)",
    colorFuture: "rgba(0,212,255,0.07)", colorFutureStroke: "rgba(0,212,255,0.2)",
    totalUnits: p.totalYears * 52, unitsPassed: p.weeksPassed,
    labelEvery: 1, labelMultiplier: 1,
  };
}

function drawGrid(
  ctx: CanvasRenderingContext2D,
  offsetY: number,
  t: number, z: number, w: number, h: number,
  cfg: ModeConfig, diaryEntries: DiaryMap, hudVisible: boolean,
) {
  const { cols, rows, cell, gap, colorLived, colorCurrent, colorGlow, colorFuture, colorFutureStroke, unitsPassed, totalUnits, labelEvery, labelMultiplier, showYearInCell, birthYear } = cfg;
  const cz = cell * z;
  const gz = gap * z;
  const step = cz + gz;
  const lw = LABEL_BASE * z;
  const topPad = TOP_PAD_BASE * z;
  const totalW = lw + cols * step;
  const cx0 = Math.max(8 * z, (w - totalW) / 2);

  for (let row = 0; row < rows; row++) {
    const ry = topPad + row * step;

    // Row culling
    if (ry + offsetY > h + step) break;
    if (ry + cz + offsetY < -step) continue;

    // Year label
    if (hudVisible && row % labelEvery === 0) {
      const fs = Math.max(7, Math.min(12, 10 * z));
      ctx.font = `600 ${fs}px system-ui, -apple-system, sans-serif`;
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillStyle = row % 10 === 0 ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.3)";
      ctx.fillText(String(row * labelMultiplier), cx0 - 6 * z, ry + cz / 2);
    }

    // Decade separator
    if (row > 0 && row % 10 === 0) {
      ctx.fillStyle = "rgba(255,255,255,0.07)";
      ctx.fillRect(cx0, ry - gz / 2, cols * step - gz, Math.max(1, z));
    }

    for (let col = 0; col < cols; col++) {
      const cx = cx0 + col * step;
      const idx = row * cols + col;
      if (idx >= totalUnits) break;

      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      if (idx === unitsPassed) {
        const pulse = 0.75 + 0.25 * Math.sin(t * 2.5);
        ctx.shadowColor = colorGlow;
        ctx.shadowBlur = 14 * z;
        ctx.globalAlpha = pulse;
        ctx.fillStyle = colorCurrent;
        ctx.beginPath();
        ctx.roundRect(cx, ry, cz, cz, Math.max(2, 3 * z));
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      } else if (idx < unitsPassed) {
        ctx.fillStyle = colorLived;
        ctx.beginPath();
        ctx.roundRect(cx, ry, cz, cz, Math.max(2, 3 * z));
        ctx.fill();
      } else {
        ctx.fillStyle = colorFuture;
        ctx.beginPath();
        ctx.roundRect(cx, ry, cz, cz, Math.max(2, 3 * z));
        ctx.fill();
        ctx.strokeStyle = colorFutureStroke;
        ctx.lineWidth = Math.max(0.5, 1 * z);
        ctx.stroke();
      }

      // Year number inside cell (years mode only)
      if (showYearInCell && cz > 20) {
        const yearValue = birthYear + idx;
        const fs = Math.max(7, Math.min(12, 10 * z));
        ctx.font = `700 ${fs}px system-ui, -apple-system, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = idx <= unitsPassed ? "rgba(0,0,0,0.7)" : "rgba(255,255,255,0.25)";
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
        ctx.fillText(String(yearValue), cx + cz / 2, ry + cz / 2);
      }

      // Diary dot (weeks mode only)
      if (cols === 52 && diaryEntries[idx.toString()]) {
        ctx.beginPath();
        ctx.arc(cx + cz / 2, ry + cz / 2, Math.max(1.5, 2 * z), 0, Math.PI * 2);
        ctx.fillStyle = "#fbbf24";
        ctx.globalAlpha = 0.9;
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }
  }
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

    const cfg = buildConfig({ weeksPassed: p.weeksPassed, totalYears: p.totalYears, birthYear: p.birthYear }, p.gridMode);
    drawGrid(ctx, p.offsetY, time / 1000, p.zoom, w, h, cfg, p.diaryEntries, p.hudVisible);

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

    const cfg = buildConfig({ weeksPassed: p.weeksPassed, totalYears: p.totalYears, birthYear: p.birthYear }, p.gridMode);
    const cz = cfg.cell * z, gz = cfg.gap * z, step = cz + gz;
    const lw = LABEL_BASE * z;
    const topPad = TOP_PAD_BASE * z;
    const totalW = lw + cfg.cols * step;
    const cx0 = Math.max(8 * z, (w - totalW) / 2);

    const col = Math.floor((mx - cx0) / step);
    const row = Math.floor((my - topPad) / step);

    if (col < 0 || col >= cfg.cols || row < 0 || row >= cfg.rows) return;
    const idx = row * cfg.cols + col;
    if (idx > cfg.unitsPassed) return;

    let weekIdx = idx;
    if (p.gridMode === "months") weekIdx = Math.floor(idx * 52 / 12);
    else if (p.gridMode === "years") weekIdx = idx * 52;

    p.onWeekSelect(weekIdx, Math.floor(weekIdx / 52), weekIdx % 52);
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ touchAction: "none" }} onClick={handleClick} />;
};

export default ResonanceCanvas;
