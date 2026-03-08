import React from "react";
import { motion } from "framer-motion";
import AnimatedCounter from "./AnimatedCounter";

type Variant = "default" | "mini" | "daysLived" | "daysRemaining" | "weeksLived" | "weeksRemaining" | "waking";

interface StatCardProps {
  value: number;
  label: string;
  variant?: Variant;
  index?: number;
  sublabel?: string;
  /** Skip animation for rapidly ticking values (e.g. seconds) */
  live?: boolean;
}

const STYLES: Record<string, { text: string; border: string; glow: string }> = {
  daysLived:      { text: "from-[#e0f7fa] to-primary",  border: "from-primary to-[#0088ff]",  glow: "glow-cyan" },
  weeksLived:     { text: "from-[#e0f7fa] to-primary",  border: "from-primary to-[#0088ff]",  glow: "glow-cyan" },
  daysRemaining:  { text: "from-[#fff3e0] to-accent",   border: "from-[#ff9f43] to-accent",   glow: "glow-coral" },
  weeksRemaining: { text: "from-[#fff3e0] to-accent",   border: "from-[#ff9f43] to-accent",   glow: "glow-coral" },
  waking:         { text: "from-[#f3e5f5] to-[#8e44ad]", border: "from-[#8e44ad] to-[#6c3483]", glow: "glow-purple" },
  default:        { text: "from-white to-gray-300",       border: "from-primary to-accent",       glow: "" },
  mini:           { text: "from-white to-gray-400",       border: "from-primary/60 to-accent/60", glow: "" },
};

const StatCard: React.FC<StatCardProps> = ({ value, label, variant = "default", index = 0, sublabel, live = false }) => {
  const isMini = variant === "mini";
  const s = STYLES[variant] ?? STYLES.default;

  return (
    <motion.div
      className={`glass glass-hover rounded-xl text-center shadow-xl flex flex-col items-center justify-center relative overflow-hidden h-full
                  ${isMini ? "p-3 sm:p-4" : "p-5 sm:p-6"}`}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.06, ease: "easeOut" }}
    >
      {/* Top accent bar */}
      <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${s.border}`} />

      <div className={`font-bold mb-1.5 leading-none counter-digits text-transparent bg-clip-text bg-gradient-to-b ${s.text}
                       ${isMini ? "text-xl sm:text-2xl" : "text-3xl sm:text-4xl"}`}>
        {live ? value.toLocaleString() : <AnimatedCounter value={value} />}
      </div>
      <div className={`uppercase tracking-[0.15em] font-medium text-text-muted ${isMini ? "text-[0.55rem] sm:text-[0.65rem]" : "text-[0.6rem] sm:text-xs"}`}>
        {label}
      </div>
      {sublabel && (
        <div className="text-[0.5rem] text-text-muted/50 mt-1">{sublabel}</div>
      )}
    </motion.div>
  );
};

export default StatCard;
