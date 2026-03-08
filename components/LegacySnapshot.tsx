import React, { useRef, useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { LifeStats } from "../types";
import type { MoodEntry } from "../hooks/useMood";
import { getGeneration } from "../lib/generations";
import { getZodiacSign } from "../lib/zodiac";
import { getChineseZodiac } from "../lib/lifeData";

interface LegacySnapshotProps {
  isOpen: boolean;
  onClose: () => void;
  lifeStats: LifeStats;
  birthYear: number;
  birthMonth: number;
  birthDay: number;
  displayName: string;
  todayMood: MoodEntry | null;
}

const LegacySnapshot: React.FC<LegacySnapshotProps> = ({
  isOpen, onClose, lifeStats, birthYear, birthMonth, birthDay, displayName, todayMood,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [sharing, setSharing] = useState(false);

  const generation = getGeneration(birthYear);
  const zodiac = getZodiacSign(birthMonth, birthDay);
  const chinese = getChineseZodiac(birthYear);
  const pct = parseFloat(lifeStats.percentageLived);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = 1080;
    const H = 1920;
    canvas.width = W;
    canvas.height = H;

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, "#0a0a23");
    grad.addColorStop(0.5, "#0f0f33");
    grad.addColorStop(1, "#0a0a23");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Decorative particles
    for (let i = 0; i < 80; i++) {
      const px = Math.random() * W;
      const py = Math.random() * H;
      const alpha = Math.random() * 0.3;
      ctx.fillStyle = `rgba(0, 212, 255, ${alpha})`;
      ctx.beginPath();
      ctx.arc(px, py, Math.random() * 2 + 0.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Central ring
    const cx = W / 2;
    const ringY = 420;
    const ringR = 160;
    const ringW = 14;

    // Track
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = ringW;
    ctx.beginPath();
    ctx.arc(cx, ringY, ringR, 0, Math.PI * 2);
    ctx.stroke();

    // Progress arc
    const ringGrad = ctx.createLinearGradient(cx - ringR, ringY - ringR, cx + ringR, ringY + ringR);
    ringGrad.addColorStop(0, "#00d4ff");
    ringGrad.addColorStop(0.5, "#8e44ad");
    ringGrad.addColorStop(1, "#ff6b6b");
    ctx.strokeStyle = ringGrad;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(cx, ringY, ringR, -Math.PI / 2, -Math.PI / 2 + (pct / 100) * Math.PI * 2);
    ctx.stroke();

    // Percentage text
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 72px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${pct}%`, cx, ringY - 10);
    ctx.font = "14px system-ui";
    ctx.fillStyle = "rgba(180,180,199,0.8)";
    ctx.fillText("OF MY JOURNEY", cx, ringY + 35);

    // Name
    ctx.font = "bold 48px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(displayName || "My Life", cx, ringY + ringR + 80);

    // Date
    ctx.font = "20px system-ui";
    ctx.fillStyle = "rgba(180,180,199,0.7)";
    ctx.fillText(lifeStats.currentDateFormatted, cx, ringY + ringR + 120);

    // Stats grid
    const statsY = 780;
    const stats = [
      { value: lifeStats.daysPassed.toLocaleString(), label: "DAYS LIVED" },
      { value: lifeStats.weeksPassed.toLocaleString(), label: "WEEKS LIVED" },
      { value: lifeStats.daysRemaining.toLocaleString(), label: "DAYS AHEAD" },
      { value: lifeStats.weeksRemaining.toLocaleString(), label: "WEEKS AHEAD" },
    ];

    const colW = W / 2;
    stats.forEach((s, i) => {
      const sx = (i % 2) * colW + colW / 2;
      const sy = statsY + Math.floor(i / 2) * 130;

      ctx.font = "bold 44px system-ui, -apple-system, sans-serif";
      ctx.fillStyle = i < 2 ? "#00d4ff" : "#ff6b6b";
      ctx.fillText(s.value, sx, sy);

      ctx.font = "12px system-ui";
      ctx.fillStyle = "rgba(180,180,199,0.6)";
      ctx.fillText(s.label, sx, sy + 30);
    });

    // Badges
    const badgeY = 1120;
    const badges = [
      generation ? `${generation.emoji} ${generation.name}` : null,
      zodiac ? `${zodiac.symbol} ${zodiac.name}` : null,
      `${chinese.emoji} Year of the ${chinese.animal}`,
    ].filter(Boolean) as string[];

    ctx.font = "16px system-ui";
    const totalBadgeW = badges.reduce((sum, b) => sum + ctx.measureText(b).width + 40, 0) - 16;
    let bx = cx - totalBadgeW / 2;

    badges.forEach((badge) => {
      const bw = ctx.measureText(badge).width + 32;
      ctx.fillStyle = "rgba(142, 68, 173, 0.15)";
      ctx.beginPath();
      ctx.roundRect(bx, badgeY, bw, 36, 18);
      ctx.fill();
      ctx.strokeStyle = "rgba(142, 68, 173, 0.3)";
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = "rgba(195, 155, 211, 0.9)";
      ctx.textAlign = "center";
      ctx.fillText(badge, bx + bw / 2, badgeY + 22);
      bx += bw + 12;
    });
    ctx.textAlign = "center";

    // Milestones
    const msY = 1220;
    ctx.font = "bold 22px system-ui";
    ctx.fillStyle = "#00d4ff";
    ctx.fillText("LIFE MILESTONES", cx, msY);

    const milestones = [
      { label: "Quarter Life", date: lifeStats.milestones.quarter, color: "#4CAF50" },
      { label: "Halfway", date: lifeStats.milestones.halfway, color: "#2196F3" },
      { label: "Three-Quarter", date: lifeStats.milestones.threeQuarter, color: "#9C27B0" },
    ];

    milestones.forEach((m, i) => {
      const my = msY + 50 + i * 70;
      ctx.fillStyle = m.color;
      ctx.beginPath();
      ctx.arc(cx - 140, my, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = "bold 18px system-ui";
      ctx.fillStyle = m.color;
      ctx.textAlign = "left";
      ctx.fillText(m.label, cx - 120, my + 2);

      ctx.font = "18px system-ui";
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "right";
      ctx.fillText(m.date, cx + 160, my + 2);
    });
    ctx.textAlign = "center";

    // Mood
    if (todayMood) {
      ctx.font = "48px system-ui";
      ctx.fillText(todayMood.mood, cx, 1530);
      ctx.font = "14px system-ui";
      ctx.fillStyle = "rgba(180,180,199,0.5)";
      ctx.fillText("TODAY'S MOOD", cx, 1565);
    }

    // Footer branding
    ctx.font = "bold 16px system-ui";
    ctx.fillStyle = "rgba(0, 212, 255, 0.4)";
    ctx.fillText("LIFE IN WEEKS", cx, H - 80);
    ctx.font = "12px system-ui";
    ctx.fillStyle = "rgba(180,180,199,0.3)";
    ctx.fillText("lifeinweeks.app · Your life, visualized", cx, H - 55);
  }, [lifeStats, pct, displayName, generation, zodiac, chinese, todayMood]);

  // Render when opened
  React.useEffect(() => {
    if (isOpen) setTimeout(render, 100);
  }, [isOpen, render]);

  async function handleShare() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setSharing(true);
    try {
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
      if (!blob) return;

      if (navigator.share && navigator.canShare?.({ files: [new File([blob], "life-snapshot.png")] })) {
        await navigator.share({
          title: "My Life in Weeks",
          text: `I'm ${pct}% through my life journey.`,
          files: [new File([blob], "life-snapshot.png", { type: "image/png" })],
        });
      } else {
        // Fallback: download
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "life-in-weeks-snapshot.png";
        a.click();
        URL.revokeObjectURL(url);
      }
    } finally {
      setSharing(false);
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-[1000] p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            className="bg-bg-dark rounded-xl shadow-2xl border border-box-border flex flex-col items-center max-h-[90vh] overflow-hidden"
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
          >
            <div className="p-4 flex items-center justify-between w-full">
              <h3 className="text-sm font-semibold text-primary">Legacy Snapshot</h3>
              <button onClick={onClose} className="text-text-muted hover:text-white">✕</button>
            </div>

            <div className="overflow-auto flex-1 px-4 pb-4">
              <canvas ref={canvasRef} className="rounded-lg" style={{ width: 320, height: 568 }} />
            </div>

            <div className="p-4 pt-2 w-full flex gap-2">
              <button onClick={handleShare} disabled={sharing}
                className="flex-1 h-10 rounded-lg bg-primary hover:bg-primary-dark text-bg-dark text-sm font-semibold transition-colors disabled:opacity-50">
                {sharing ? "Sharing..." : typeof navigator.share === "function" ? "Share" : "Download"}
              </button>
              <button onClick={onClose}
                className="h-10 px-4 rounded-lg border border-box-border text-text-muted text-sm hover:text-white transition-colors">
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LegacySnapshot;
