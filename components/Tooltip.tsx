
import React from 'react';
import { HoverInfo } from '../types';

interface TooltipProps {
  hoverInfo: HoverInfo | null;
}

const Tooltip: React.FC<TooltipProps> = ({ hoverInfo }) => {
  if (!hoverInfo) return null;

  // Default transform if not provided
  const transformClass = hoverInfo.transform || 'transform -translate-x-1/2 -translate-y-[calc(100%+10px)]';
  
  return (
    <div
      className={`fixed z-[1000] bg-[rgba(25,25,55,0.85)] backdrop-blur-md rounded-md p-3 shadow-2xl border border-primary pointer-events-none transition-opacity duration-150 ease-in-out min-w-[180px] max-w-[250px] text-sm text-left animate-fade-in ${transformClass} ${hoverInfo ? 'opacity-100' : 'opacity-0'}`}
      style={{ left: `${hoverInfo.x}px`, top: `${hoverInfo.y}px` }} // Using style for dynamic positioning as it's the most practical way
      dangerouslySetInnerHTML={{ __html: hoverInfo.content }}
    >
    </div>
  );
};

export default Tooltip;