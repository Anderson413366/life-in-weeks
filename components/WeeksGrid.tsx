import React, { useRef, useCallback } from "react";
import { format, addWeeks } from "date-fns";
import type { DiaryMap, HoverInfo } from "../types";

const VISIBLE_WEEKS = 52;

/* ── Single cell ─────────────────────────────────────────────── */

interface CellProps {
  weekIndex: number;
  row: number;
  col: number;
  isCurrent: boolean;
  isPast: boolean;
  isDecadeMarker: boolean;
  hasDiary: boolean;
  birthdate: string;
  weeksPassed: number;
  diaryEntries: DiaryMap;
  onHover: (info: HoverInfo | null) => void;
  onClick: () => void;
}

const GridCell: React.FC<CellProps> = React.memo(
  ({ weekIndex, row, col, isCurrent, isPast, isDecadeMarker, hasDiary, birthdate, weeksPassed, diaryEntries, onHover, onClick }) => {
    const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
      const birth = new Date(birthdate);
      if (isNaN(birth.getTime())) return;

      const startDate = addWeeks(birth, weekIndex);
      const entry = diaryEntries[weekIndex.toString()];
      const preview = entry ? entry.substring(0, 50) + (entry.length > 50 ? "..." : "") : null;

      const status = isCurrent ? "Current" : isPast ? "Past" : "Future";
      const statusColor = isCurrent ? "text-accent" : isPast ? "text-primary" : "text-text-muted";

      const html = `
        <div class="text-left">
          <div class="font-semibold text-primary mb-0.5 text-[0.9em]">Week ${col + 1}, Year ${row}</div>
          <div class="text-text-muted mb-0.5 text-[0.8em]">${format(startDate, "MMM d, yyyy")}</div>
          <div class="text-[0.8em] font-medium ${statusColor} mb-1">${status}</div>
          ${preview ? `<div class="mt-1 pt-1 border-t border-[rgba(255,255,255,0.15)] italic text-text-main max-w-[200px] text-[0.8em] leading-snug">${preview.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>` : ""}
          ${weekIndex <= weeksPassed ? `<div class="mt-1.5 text-[0.75em] text-primary-dark opacity-90">Click to add/edit diary entry</div>` : ""}
        </div>`;

      const rect = e.currentTarget.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const estimatedHeight = 120;
      const aboveOk = rect.top - estimatedHeight - 10 > 0;

      onHover({
        content: html,
        x,
        y: aboveOk ? rect.top - 10 : rect.bottom + 10,
        transform: aboveOk
          ? "transform -translate-x-1/2 -translate-y-[calc(100%+10px)]"
          : "transform -translate-x-1/2 translate-y-[10px]",
      });
    };

    return (
      <div
        className={`
          w-[18px] h-[18px] sm:w-[20px] sm:h-[20px] lg:w-[22px] lg:h-[22px]
          box-border border border-box-border bg-bg-light rounded-[2px]
          transition-all duration-200 ease-in-out relative cursor-pointer
          hover:scale-125 hover:border-primary hover:z-10 hover:shadow-lg hover:shadow-primary/30
          focus:outline-none focus:ring-2 focus:ring-primary focus:z-10
          ${isPast ? "!bg-primary shadow-sm shadow-primary/20" : ""}
          ${isCurrent ? "!bg-accent !border-accent shadow-md shadow-accent/40 animate-pulse-slow z-[5]" : ""}
          ${isDecadeMarker ? "before:content-[''] before:absolute before:left-[-2px] before:top-0 before:bottom-0 before:w-0.5 before:bg-decade-marker before:opacity-70 before:z-[1]" : ""}
          ${hasDiary ? "after:content-['📝'] after:absolute after:text-[9px] after:top-1/2 after:left-1/2 after:-translate-x-1/2 after:-translate-y-1/2 after:opacity-70 after:pointer-events-none" : ""}
        `}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => onHover(null)}
        onClick={onClick}
        onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && weekIndex <= weeksPassed) onClick(); }}
        role="button"
        tabIndex={0}
        aria-label={`Week ${col + 1}, Year ${row}. ${isCurrent ? "Current" : isPast ? "Past" : "Future"}${hasDiary ? ". Has diary entry." : ""}`}
      />
    );
  },
);

/* ── Grid ────────────────────────────────────────────────────── */

interface WeeksGridProps {
  weeksPassed: number;
  totalYears: number;
  birthdate: string;
  onHover: (info: HoverInfo | null) => void;
  onWeekClick: (weekIndex: number, row: number, col: number) => void;
  diaryEntries: DiaryMap;
  scale: number;
}

const WeeksGrid: React.FC<WeeksGridProps> = ({ weeksPassed, totalYears, birthdate, onHover, onWeekClick, diaryEntries, scale }) => {
  const gridRef = useRef<HTMLDivElement>(null);

  const handleClick = useCallback(
    (weekIndex: number, row: number, col: number) => {
      if (weekIndex <= weeksPassed) onWeekClick(weekIndex, row, col);
    },
    [weeksPassed, onWeekClick],
  );

  if (totalYears <= 0 || totalYears > 120) {
    return <div className="text-text-muted text-center p-4">Invalid life expectancy (1–120).</div>;
  }

  return (
    <div className="relative w-full overflow-x-auto mb-4 sm:mb-6">
      <div
        ref={gridRef}
        className="inline-block transition-transform duration-300 ease-out origin-top-left"
        style={{ transform: `scale(${scale})`, width: scale < 1 ? `${(1 / scale) * 100}%` : "auto" }}
      >
        <div className="inline-flex flex-col animate-fade-in min-w-min mx-auto border border-box-border p-1 sm:p-2 bg-[rgba(0,0,0,0.05)] rounded-sm">
          {/* Header row */}
          <div className="flex items-center gap-px">
            <div className="min-w-[22px] sm:min-w-[25px] lg:min-w-[28px] h-[18px] sm:h-[20px] lg:h-[22px]" />
            {Array.from({ length: VISIBLE_WEEKS }, (_, i) => (
              <div
                key={i}
                className="text-primary font-medium text-[8px] sm:text-[9px] lg:text-[10px] h-[18px] sm:h-[20px] lg:h-[22px] w-[18px] sm:w-[20px] lg:w-[22px] flex items-center justify-center bg-[rgba(0,0,0,0.1)] rounded-[2px]"
              >
                {i + 1}
              </div>
            ))}
          </div>

          {/* Year rows */}
          {Array.from({ length: totalYears }, (_, row) => (
            <div key={row} className="flex items-center gap-px">
              <div className="text-primary font-medium min-w-[22px] sm:min-w-[25px] lg:min-w-[28px] h-[18px] sm:h-[20px] lg:h-[22px] text-[9px] sm:text-[10px] lg:text-[11px] flex items-center justify-center pr-1">
                {row}
              </div>
              {Array.from({ length: VISIBLE_WEEKS }, (_, col) => {
                const idx = row * VISIBLE_WEEKS + col;
                return (
                  <GridCell
                    key={col}
                    weekIndex={idx}
                    row={row}
                    col={col}
                    isCurrent={idx === weeksPassed}
                    isPast={idx < weeksPassed}
                    isDecadeMarker={row > 0 && row % 10 === 0 && col === 0}
                    hasDiary={!!diaryEntries[idx.toString()]}
                    birthdate={birthdate}
                    weeksPassed={weeksPassed}
                    diaryEntries={diaryEntries}
                    onHover={onHover}
                    onClick={() => handleClick(idx, row, col)}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WeeksGrid;
