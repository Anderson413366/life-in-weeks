import React from "react";
import type { HoverInfo } from "../types";

interface TooltipProps {
  hoverInfo: HoverInfo | null;
}

const Tooltip: React.FC<TooltipProps> = ({ hoverInfo }) => {
  if (!hoverInfo) return null;

  const transformClass = hoverInfo.transform ?? "transform -translate-x-1/2 -translate-y-[calc(100%+10px)]";

  return (
    <div
      className={`fixed z-[1000] bg-[rgba(25,25,55,0.85)] backdrop-blur-md rounded-md p-3 shadow-2xl border border-primary pointer-events-none min-w-[180px] max-w-[250px] text-sm text-left animate-fade-in ${transformClass}`}
      style={{ left: hoverInfo.x, top: hoverInfo.y }}
      dangerouslySetInnerHTML={{ __html: hoverInfo.content }}
    />
  );
};

export default Tooltip;
