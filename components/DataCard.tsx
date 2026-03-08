import React from "react";
import { motion } from "framer-motion";

interface DataCardProps {
  icon: string;
  value: string | number;
  label: string;
  sublabel?: string;
  color?: string;
  index?: number;
}

const DataCard: React.FC<DataCardProps> = ({ icon, value, label, sublabel, color = "#00d4ff", index = 0 }) => (
  <motion.div
    className="glass glass-hover rounded-xl p-4 flex items-center gap-3 text-left h-full"
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.04, duration: 0.4 }}
  >
    <div
      className="text-2xl w-10 h-10 flex items-center justify-center rounded-lg shrink-0"
      style={{ backgroundColor: `${color}15` }}
    >
      {icon}
    </div>
    <div className="min-w-0">
      <div className="text-lg sm:text-xl font-bold text-white counter-digits truncate">
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
      <div className="text-[0.6rem] sm:text-xs text-text-muted uppercase tracking-wider">{label}</div>
      {sublabel && <div className="text-[0.5rem] text-text-muted/50 mt-0.5">{sublabel}</div>}
    </div>
  </motion.div>
);

export default DataCard;
