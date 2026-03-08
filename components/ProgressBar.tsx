import React from "react";
import { motion } from "framer-motion";

interface ProgressBarProps {
  label: string;
  value: number;
  color: string;
  index?: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ label, value, color, index = 0 }) => (
  <motion.div
    className="glass rounded-lg p-4"
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.4, delay: index * 0.1 }}
  >
    <div className="flex justify-between items-baseline mb-2">
      <span className="text-sm text-text-muted font-medium">{label}</span>
      <span className="text-sm font-bold text-white counter-digits">{value.toFixed(1)}%</span>
    </div>
    <div className="w-full h-2 bg-[rgba(255,255,255,0.05)] rounded-full overflow-hidden">
      <motion.div
        className={`h-full rounded-full ${color}`}
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 + index * 0.1 }}
        style={{ boxShadow: `0 0 12px ${color === "bg-primary" ? "rgba(0,212,255,0.4)" : color === "bg-accent" ? "rgba(255,107,107,0.4)" : "rgba(76,175,80,0.4)"}` }}
      />
    </div>
  </motion.div>
);

export default ProgressBar;
