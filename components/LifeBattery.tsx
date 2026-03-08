import React from "react";
import { motion } from "framer-motion";

interface LifeBatteryProps {
  percentUsed: number;
  size?: "sm" | "md" | "lg";
}

/**
 * iPhone-style battery bar showing REMAINING life.
 * Green (>50%) → Yellow (20-50%) → Red (<20%)
 */
function getBatteryColor(remaining: number): { bar: string; glow: string; text: string } {
  if (remaining > 50) return { bar: "#34C759", glow: "rgba(52,199,89,0.4)",  text: "#34C759" };  // Green
  if (remaining > 20) return { bar: "#FFD60A", glow: "rgba(255,214,10,0.4)", text: "#FFD60A" };  // Yellow
  return                      { bar: "#FF3B30", glow: "rgba(255,59,48,0.4)", text: "#FF3B30" };  // Red
}

const SIZES = {
  sm: { w: "w-32",  h: "h-2.5", tip: "w-1 h-1.5",  text: "text-xs",  rounded: "rounded-[3px]" },
  md: { w: "w-48",  h: "h-4",   tip: "w-1.5 h-2.5", text: "text-sm",  rounded: "rounded-[4px]" },
  lg: { w: "w-64",  h: "h-5",   tip: "w-2 h-3",     text: "text-base", rounded: "rounded-[5px]" },
};

const LifeBattery: React.FC<LifeBatteryProps> = ({ percentUsed, size = "md" }) => {
  const remaining = Math.max(0, Math.min(100, 100 - percentUsed));
  const color = getBatteryColor(remaining);
  const s = SIZES[size];

  return (
    <div className="flex items-center gap-2">
      {/* Battery body */}
      <div className="flex items-center gap-0.5">
        <div className={`${s.w} ${s.h} ${s.rounded} border border-[rgba(255,255,255,0.25)] bg-[rgba(0,0,0,0.3)] relative overflow-hidden p-[2px]`}>
          <motion.div
            className={`h-full ${s.rounded}`}
            style={{
              backgroundColor: color.bar,
              boxShadow: `0 0 8px ${color.glow}`,
            }}
            initial={{ width: 0 }}
            animate={{ width: `${remaining}%` }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
        </div>
        {/* Battery tip */}
        <div className={`${s.tip} rounded-r-sm bg-[rgba(255,255,255,0.25)]`} />
      </div>

      {/* Percentage */}
      <span className={`${s.text} font-bold counter-digits`} style={{ color: color.text }}>
        {remaining.toFixed(1)}%
      </span>
    </div>
  );
};

export default LifeBattery;
