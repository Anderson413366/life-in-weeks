import React from "react";

interface ProgressBarProps {
  label: string;
  value: number;
  color: string;
  index?: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ label, value, color, index = 0 }) => (
  <div
    className="glass rounded-lg p-4"
    style={{
      opacity: 1,
      transform: "translateX(0)",
      transitionDelay: `${index * 0.1}s`,
    }}
  >
    <div className="flex justify-between items-baseline mb-2">
      <span className="text-sm text-text-muted font-medium">{label}</span>
      <span className="text-sm font-bold text-white counter-digits">{value.toFixed(1)}%</span>
    </div>
    <div className="w-full h-2 bg-[rgba(255,255,255,0.05)] rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full ${color}`}
        style={{
          width: `${value}%`,
          transition: `width 1.2s ease-out ${0.2 + index * 0.1}s`,
          boxShadow: `0 0 12px ${color === "bg-primary" ? "rgba(0,212,255,0.4)" : color === "bg-accent" ? "rgba(255,107,107,0.4)" : "rgba(76,175,80,0.4)"}`,
        }}
      />
    </div>
  </div>
);

export default ProgressBar;
