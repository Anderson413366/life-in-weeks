import React from "react";

interface LifeBatteryProps {
  percentUsed: number;
  size?: "sm" | "md" | "lg";
}

/**
 * iPhone-style battery: green until 20%, yellow 10-20%, red below 10%.
 */
function getBatteryColor(remaining: number): { bar: string; glow: string; text: string } {
  if (remaining > 20) return { bar: "#34C759", glow: "rgba(52,199,89,0.35)", text: "#34C759" };
  if (remaining > 10) return { bar: "#FFD60A", glow: "rgba(255,214,10,0.35)", text: "#FFD60A" };
  return                      { bar: "#FF3B30", glow: "rgba(255,59,48,0.4)",  text: "#FF3B30" };
}

const SIZES = {
  sm: { w: "w-28",  h: "h-3.5", tip: "w-[5px] h-[10px]", text: "text-xs",   rounded: "rounded-[4px]", inner: "rounded-[3px]", pad: "p-[2px]" },
  md: { w: "w-44",  h: "h-5",   tip: "w-[6px] h-[12px]", text: "text-sm",   rounded: "rounded-[5px]", inner: "rounded-[4px]", pad: "p-[2.5px]" },
  lg: { w: "w-56",  h: "h-7",   tip: "w-[7px] h-[16px]", text: "text-base", rounded: "rounded-[6px]", inner: "rounded-[5px]", pad: "p-[3px]" },
};

const LifeBattery: React.FC<LifeBatteryProps> = ({ percentUsed, size = "md" }) => {
  const remaining = Math.max(0, Math.min(100, 100 - percentUsed));
  const color = getBatteryColor(remaining);
  const s = SIZES[size];

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center">
        {/* Battery body */}
        <div className={`${s.w} ${s.h} ${s.rounded} border-2 border-[rgba(255,255,255,0.35)] bg-[rgba(0,0,0,0.2)] relative overflow-hidden ${s.pad}`}>
          <div
            className={`h-full ${s.inner}`}
            style={{
              backgroundColor: color.bar,
              width: `${remaining}%`,
              transition: "width 1.5s ease-out",
            }}
          />
        </div>
        {/* Battery tip (positive terminal) */}
        <div className={`${s.tip} rounded-r-[2px] bg-[rgba(255,255,255,0.35)] ml-[1px]`} />
      </div>

      {/* Percentage */}
      <span className={`${s.text} font-bold counter-digits`} style={{ color: color.text }}>
        {remaining.toFixed(1)}%
      </span>
    </div>
  );
};

export default LifeBattery;
