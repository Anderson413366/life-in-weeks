import React, { useState, useCallback, useRef } from "react";
import { useGesture } from "@use-gesture/react";
import { useSpring } from "@react-spring/web";
import { motion } from "framer-motion";
import { addWeeks, format } from "date-fns";
import type { LifeStats, DiaryMap, SelectedWeek, HoverInfo } from "../types";
import type { AppMode } from "../lib/theme";
import type { FullDiaryEntry } from "../hooks/useDiary";
import ResonanceCanvas from "./ResonanceCanvas";
import LifeBattery from "./LifeBattery";
import DiaryModal from "./DiaryModal";
import Tooltip from "./Tooltip";

interface ResonanceGridProps {
  lifeStats: LifeStats;
  birthdate: string;
  lifeExpectancy: number;
  diaryEntries: DiaryMap;
  fullEntries: FullDiaryEntry[];
  userId?: string;
  mode: AppMode;
  onSaveDiary: (weekIndex: number, content: string, photos?: string[]) => Promise<void>;
}

const ResonanceGrid: React.FC<ResonanceGridProps> = ({
  lifeStats, birthdate, lifeExpectancy, diaryEntries, fullEntries, userId, mode, onSaveDiary,
}) => {
  const [selectedWeek, setSelectedWeek] = useState<SelectedWeek | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hoverInfo] = useState<HoverInfo | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Spring-animated zoom + pan
  const [{ zoom, x, y }, api] = useSpring(() => ({ zoom: 1, x: 0, y: 0, config: { tension: 200, friction: 30 } }));

  const bind = useGesture(
    {
      onPinch: ({ offset: [d] }) => {
        api.start({ zoom: Math.max(0.4, Math.min(6, 1 + (d - 1) * 0.5)) });
      },
      onDrag: ({ offset: [dx, dy], pinching }) => {
        if (pinching) return;
        api.start({ x: dx, y: dy });
      },
      onWheel: ({ delta: [, dy], event }) => {
        event.preventDefault();
        const newZoom = Math.max(0.4, Math.min(6, zoom.get() - dy * 0.002));
        api.start({ zoom: newZoom });
      },
    },
    {
      drag: { from: () => [x.get(), y.get()] },
      pinch: { scaleBounds: { min: 0.4, max: 6 }, from: () => [zoom.get(), 0] },
      wheel: { eventOptions: { passive: false } },
    },
  );

  const openDiary = useCallback((weekIndex: number, row: number, col: number) => {
    const birth = new Date(birthdate);
    if (isNaN(birth.getTime())) return;
    setSelectedWeek({ index: weekIndex, row, col, date: format(addWeeks(birth, weekIndex), "MMM d, yyyy") });
    setIsModalOpen(true);
  }, [birthdate]);

  const closeDiary = useCallback(() => { setIsModalOpen(false); setSelectedWeek(null); }, []);

  const pct = parseFloat(lifeStats.percentageLived);
  const currentEntry = selectedWeek ? diaryEntries[selectedWeek.index.toString()] ?? "" : "";
  const currentPhotos = selectedWeek ? fullEntries.find((e) => e.week_index === selectedWeek.index)?.photos ?? [] : [];
  const entryCount = Object.keys(diaryEntries).length;

  const focusStyle = mode === "focus";

  return (
    <motion.div
      className="flex flex-col gap-4 w-full"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Info bar */}
      <div className={`${focusStyle ? "bg-[#111] border border-[#333]" : "glass"} rounded-xl p-3 sm:p-4 flex flex-wrap items-center justify-center gap-3 sm:gap-6`}>
        <div className="flex items-center gap-2">
          <span className={`text-xs ${focusStyle ? "text-[#888]" : "text-text-muted"}`}>Life Remaining</span>
          <LifeBattery percentUsed={pct} size="sm" />
        </div>
        <div className={`h-4 w-px ${focusStyle ? "bg-[#333]" : "bg-box-border"} hidden sm:block`} />
        <span className={`text-xs ${focusStyle ? "text-[#888]" : "text-text-muted"}`}>
          Week <strong className="text-white">{lifeStats.currentWeekInYear}</strong> · Year <strong className="text-white">{lifeStats.currentYearOfLife}</strong>
        </span>
        {entryCount > 0 && (
          <>
            <div className={`h-4 w-px ${focusStyle ? "bg-[#333]" : "bg-box-border"} hidden sm:block`} />
            <span className={`text-xs ${focusStyle ? "text-[#888]" : "text-text-muted"}`}>📝 {entryCount} entries</span>
          </>
        )}
        <div className={`h-4 w-px ${focusStyle ? "bg-[#333]" : "bg-box-border"} hidden sm:block`} />
        <span className={`text-[0.6rem] ${focusStyle ? "text-[#555]" : "text-text-muted/40"}`}>Pinch/scroll to zoom · Drag to pan · Click a week</span>
      </div>

      {/* Canvas container */}
      <div
        ref={containerRef}
        {...bind()}
        className={`relative w-full rounded-xl overflow-hidden border ${focusStyle ? "border-[#333] bg-black" : "border-box-border bg-[#0a0a1a]"}`}
        style={{ height: "min(70vh, 600px)", touchAction: "none" }}
      >
        <ResonanceCanvas
          weeksPassed={lifeStats.weeksPassed}
          totalYears={lifeExpectancy}
          diaryEntries={diaryEntries}
          zoom={zoom.get()}
          offsetX={x.get()}
          offsetY={y.get()}
          mode={mode}
          onWeekSelect={openDiary}
        />

        {/* Zoom indicator */}
        <div className={`absolute bottom-3 right-3 px-2 py-1 rounded-md text-[0.6rem] font-mono ${focusStyle ? "bg-[#222] text-[#888]" : "glass text-text-muted/60"}`}>
          {zoom.get().toFixed(1)}×
        </div>

        {/* Zoom controls */}
        <div className={`absolute bottom-3 left-3 flex flex-col gap-1`}>
          <button onClick={() => api.start({ zoom: Math.min(6, zoom.get() + 0.5) })}
            className={`w-8 h-8 rounded-md flex items-center justify-center text-sm ${focusStyle ? "bg-[#222] text-white" : "glass text-white"}`}>+</button>
          <button onClick={() => api.start({ zoom: Math.max(0.4, zoom.get() - 0.5) })}
            className={`w-8 h-8 rounded-md flex items-center justify-center text-sm ${focusStyle ? "bg-[#222] text-white" : "glass text-white"}`}>−</button>
          <button onClick={() => api.start({ zoom: 1, x: 0, y: 0 })}
            className={`w-8 h-8 rounded-md flex items-center justify-center text-[0.6rem] ${focusStyle ? "bg-[#222] text-[#888]" : "glass text-text-muted/60"}`}>⟳</button>
        </div>
      </div>

      {/* Legend */}
      <div className={`flex flex-wrap justify-center items-center gap-x-5 gap-y-2 text-xs ${focusStyle ? "text-[#888]" : "text-text-muted"}`}>
        {[
          { label: "Past", cls: focusStyle ? "bg-white" : "bg-primary" },
          { label: "Current", cls: focusStyle ? "bg-white animate-pulse" : "bg-accent animate-pulse" },
          { label: "Future", cls: focusStyle ? "bg-[#1a1a1a] border-[#333]" : "bg-bg-light" },
          { label: "Diary", extra: "●", color: focusStyle ? "#fff" : "#ffd700" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            {item.extra ? (
              <span className="text-[0.6rem]" style={{ color: item.color }}>{item.extra}</span>
            ) : (
              <span className={`inline-block w-3 h-3 border border-box-border rounded-sm ${item.cls}`} />
            )}
            {item.label}
          </div>
        ))}
      </div>

      <Tooltip hoverInfo={hoverInfo} />
      <DiaryModal
        isOpen={isModalOpen} onClose={closeDiary} selectedWeek={selectedWeek}
        initialEntryText={currentEntry} initialPhotos={currentPhotos}
        userId={userId} onSave={onSaveDiary}
      />
    </motion.div>
  );
};

export default ResonanceGrid;
