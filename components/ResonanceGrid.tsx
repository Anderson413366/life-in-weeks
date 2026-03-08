import React, { useState, useCallback, useRef, useEffect } from "react";
import { useGesture } from "@use-gesture/react";
import { useSpring } from "@react-spring/web";
import { motion, AnimatePresence } from "framer-motion";
import { addWeeks, format } from "date-fns";
import type { LifeStats, DiaryMap, SelectedWeek, HoverInfo } from "../types";
import type { AppMode } from "../lib/theme";
import type { FullDiaryEntry } from "../hooks/useDiary";
import type { MoodEntry } from "../hooks/useMood";
import ResonanceCanvas from "./ResonanceCanvas";
import LifeBattery from "./LifeBattery";
import DiaryModal from "./DiaryModal";
import LegacySnapshot from "./LegacySnapshot";
import Tooltip from "./Tooltip";

interface ResonanceGridProps {
  lifeStats: LifeStats;
  birthdate: string;
  lifeExpectancy: number;
  diaryEntries: DiaryMap;
  fullEntries: FullDiaryEntry[];
  userId?: string;
  mode: AppMode;
  todayMood: MoodEntry | null;
  displayName: string;
  onSaveDiary: (weekIndex: number, content: string, photos?: string[]) => Promise<void>;
}

const ResonanceGrid: React.FC<ResonanceGridProps> = ({
  lifeStats, birthdate, lifeExpectancy, diaryEntries, fullEntries, userId, mode, todayMood, displayName, onSaveDiary,
}) => {
  const [selectedWeek, setSelectedWeek] = useState<SelectedWeek | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showSnapshot, setShowSnapshot] = useState(false);
  const [hudVisible, setHudVisible] = useState(true);
  const [hoverInfo] = useState<HoverInfo | null>(null);
  const hudTimerRef = useRef<number>(0);

  const containerRef = useRef<HTMLDivElement>(null);

  // Start at cosmic overview (zoom 0.85), spring physics for natural momentum
  const [{ zoom, x, y }, api] = useSpring(() => ({
    zoom: 0.85,
    x: 0,
    y: 0,
    config: { mass: 0.8, tension: 200, friction: 28 },
  }));

  // Show HUD briefly on any interaction, then fade
  const flashHud = useCallback(() => {
    setHudVisible(true);
    clearTimeout(hudTimerRef.current);
    hudTimerRef.current = window.setTimeout(() => setHudVisible(false), 2500);
  }, []);

  // Flash HUD on mount
  useEffect(() => { flashHud(); }, [flashHud]);

  const bind = useGesture(
    {
      onPinch: ({ offset: [d] }) => {
        api.start({ zoom: Math.max(0.3, Math.min(8, 1 + (d - 1) * 0.5)) });
        flashHud();
      },
      onDrag: ({ offset: [dx, dy], pinching }) => {
        if (pinching) return;
        api.start({ x: dx, y: dy });
        flashHud();
      },
      onWheel: ({ delta: [, dy], event }) => {
        event.preventDefault();
        const curr = zoom.get();
        api.start({ zoom: Math.max(0.3, Math.min(8, curr - dy * 0.003)) });
        flashHud();
      },
    },
    {
      drag: { from: () => [x.get(), y.get()] },
      pinch: { scaleBounds: { min: 0.3, max: 8 }, from: () => [zoom.get(), 0] },
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
  const isFocus = mode === "focus";
  const entryCount = Object.keys(diaryEntries).length;

  const [birthYear, birthMonth, birthDay] = birthdate.split("-").map(Number);

  return (
    <div className="relative w-full" style={{ height: "calc(100vh - 120px)", minHeight: 400 }}>
      {/* Full-screen canvas */}
      <div
        ref={containerRef}
        {...bind()}
        className={`absolute inset-0 rounded-2xl overflow-hidden border ${isFocus ? "border-[#222] bg-black" : "border-box-border/30"}`}
        style={{ touchAction: "none" }}
      >
        <ResonanceCanvas
          weeksPassed={lifeStats.weeksPassed}
          totalYears={lifeExpectancy}
          diaryEntries={diaryEntries}
          zoom={zoom.get()}
          offsetX={x.get()}
          offsetY={y.get()}
          mode={mode}
          hudVisible={hudVisible}
          onWeekSelect={openDiary}
        />

        {/* Top HUD — fades in/out */}
        <AnimatePresence>
          {hudVisible && (
            <motion.div
              className={`absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className={`flex items-center gap-3 ${isFocus ? "bg-black/80" : "bg-[rgba(10,10,30,0.7)] backdrop-blur-md"} rounded-xl px-3 py-2 pointer-events-auto`}>
                <LifeBattery percentUsed={pct} size="sm" />
              </div>
              <div className={`flex items-center gap-3 ${isFocus ? "bg-black/80 text-[#888]" : "bg-[rgba(10,10,30,0.7)] backdrop-blur-md text-text-muted/70"} rounded-xl px-3 py-2 text-xs`}>
                <span>Wk <strong className="text-white">{lifeStats.currentWeekInYear}</strong></span>
                <span>Yr <strong className="text-white">{lifeStats.currentYearOfLife}</strong></span>
                {entryCount > 0 && <span>📝 {entryCount}</span>}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom controls */}
        <div className="absolute bottom-3 left-3 flex flex-col gap-1">
          <button onClick={() => { api.start({ zoom: Math.min(8, zoom.get() + 0.5) }); flashHud(); }}
            className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-medium ${isFocus ? "bg-[#222] text-white" : "bg-[rgba(10,10,30,0.7)] backdrop-blur-md text-white/80"}`}>+</button>
          <button onClick={() => { api.start({ zoom: Math.max(0.3, zoom.get() - 0.5) }); flashHud(); }}
            className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-medium ${isFocus ? "bg-[#222] text-white" : "bg-[rgba(10,10,30,0.7)] backdrop-blur-md text-white/80"}`}>−</button>
          <button onClick={() => { api.start({ zoom: 0.85, x: 0, y: 0 }); flashHud(); }}
            className={`w-9 h-9 rounded-lg flex items-center justify-center text-[0.6rem] ${isFocus ? "bg-[#222] text-[#888]" : "bg-[rgba(10,10,30,0.7)] backdrop-blur-md text-white/50"}`}>⟳</button>
        </div>

        {/* Zoom level */}
        <div className={`absolute bottom-3 right-3 px-2 py-1 rounded-md text-[0.55rem] font-mono ${isFocus ? "bg-[#222] text-[#666]" : "bg-[rgba(10,10,30,0.5)] text-white/30"}`}>
          {zoom.get().toFixed(1)}×
        </div>

        {/* Floating Legacy Snapshot orb */}
        <motion.button
          onClick={() => setShowSnapshot(true)}
          className="absolute bottom-3 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full flex items-center justify-center shadow-2xl"
          style={{
            background: isFocus ? "#333" : "linear-gradient(135deg, #00d4ff, #8e44ad, #ff6b6b)",
            boxShadow: isFocus ? "none" : "0 0 20px rgba(0,212,255,0.3), 0 0 40px rgba(142,68,173,0.15)",
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          title="Share Snapshot"
        >
          <span className="text-lg">{isFocus ? "📸" : "✨"}</span>
        </motion.button>
      </div>

      {/* Legend — below canvas */}
      <div className={`absolute -bottom-8 left-0 right-0 flex flex-wrap justify-center items-center gap-x-5 gap-y-1 text-[0.6rem] ${isFocus ? "text-[#666]" : "text-text-muted/40"}`}>
        {[
          { label: "Lived", color: isFocus ? "#fff" : "#00d4ff" },
          { label: "Now", color: isFocus ? "#fff" : "#ff6b6b" },
          { label: "Future", color: isFocus ? "#333" : "#1a1a3a" },
          { label: "Diary", color: isFocus ? "#fff" : "#ffd700" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: item.color }} />
            {item.label}
          </div>
        ))}
        <span className="opacity-50">Scroll/pinch to zoom · Drag to pan · Click a week</span>
      </div>

      <Tooltip hoverInfo={hoverInfo} />
      <DiaryModal
        isOpen={isModalOpen} onClose={closeDiary} selectedWeek={selectedWeek}
        initialEntryText={currentEntry} initialPhotos={currentPhotos}
        userId={userId} onSave={onSaveDiary}
      />
      <LegacySnapshot
        isOpen={showSnapshot} onClose={() => setShowSnapshot(false)}
        lifeStats={lifeStats} birthYear={birthYear} birthMonth={birthMonth} birthDay={birthDay}
        displayName={displayName} todayMood={todayMood}
      />
    </div>
  );
};

export default ResonanceGrid;
