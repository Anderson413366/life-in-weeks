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
import HelpModal from "./HelpModal";
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
  const [immersive, setImmersive] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [hoverInfo] = useState<HoverInfo | null>(null);
  const hudTimerRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const [{ zoom, x, y }, api] = useSpring(() => ({
    zoom: 0.85, x: 0, y: 0,
    config: { mass: 0.8, tension: 200, friction: 28 },
  }));

  const flashHud = useCallback(() => {
    setHudVisible(true);
    clearTimeout(hudTimerRef.current);
    hudTimerRef.current = window.setTimeout(() => setHudVisible(false), 2500);
  }, []);

  useEffect(() => { flashHud(); }, [flashHud]);

  // Escape key exits immersive mode
  useEffect(() => {
    if (!immersive) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setImmersive(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [immersive]);

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
        api.start({ zoom: Math.max(0.3, Math.min(8, zoom.get() - dy * 0.003)) });
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

  const controlCls = isFocus ? "bg-black/80 text-white" : "bg-[rgba(10,10,30,0.7)] backdrop-blur-md text-white/80";
  const controlDimCls = isFocus ? "bg-black/80 text-[#888]" : "bg-[rgba(10,10,30,0.7)] backdrop-blur-md text-white/50";

  return (
    <>
      <motion.div
        className={`relative w-full ${immersive ? "fixed inset-0 z-50" : ""}`}
        style={immersive ? undefined : { height: "calc(100vh - 120px)", minHeight: 400 }}
        layout
        transition={{ duration: 0.4, ease: "easeInOut" }}
      >
        {/* Canvas container */}
        <div
          ref={containerRef}
          {...bind()}
          className={`absolute inset-0 overflow-hidden ${immersive ? "" : "rounded-2xl"} border ${isFocus ? "border-[#222] bg-black" : "border-box-border/30 bg-[#060614]"}`}
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

          {/* ── Top HUD ──────────────────────────────────────── */}
          <AnimatePresence>
            {hudVisible && (
              <motion.div
                className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
              >
                <div className={`flex items-center gap-3 ${controlCls} rounded-xl px-3 py-2 pointer-events-auto`}>
                  <LifeBattery percentUsed={pct} size="sm" />
                </div>
                <div className={`flex items-center gap-3 ${controlDimCls} rounded-xl px-3 py-2 text-xs pointer-events-auto`}>
                  <span>Wk <strong className="text-white">{lifeStats.currentWeekInYear}</strong></span>
                  <span>Yr <strong className="text-white">{lifeStats.currentYearOfLife}</strong></span>
                  {entryCount > 0 && <span>📝 {entryCount}</span>}
                  <button onClick={() => setShowHelp(true)} className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isFocus ? "bg-white/10 text-white" : "bg-primary/20 text-primary"} hover:bg-primary/30 transition-colors`} title="Help">?</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Bottom left: zoom controls ────────────────────── */}
          <div className="absolute bottom-3 left-3 flex flex-col gap-1">
            <button onClick={() => { api.start({ zoom: Math.min(8, zoom.get() + 0.5) }); flashHud(); }}
              className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-medium ${controlCls}`}>+</button>
            <button onClick={() => { api.start({ zoom: Math.max(0.3, zoom.get() - 0.5) }); flashHud(); }}
              className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-medium ${controlCls}`}>−</button>
            <button onClick={() => { api.start({ zoom: 0.85, x: 0, y: 0 }); flashHud(); }}
              className={`w-9 h-9 rounded-lg flex items-center justify-center text-[0.6rem] ${controlDimCls}`}>⟳</button>
          </div>

          {/* ── Bottom right: zoom level + immersive toggle ──── */}
          <div className="absolute bottom-3 right-3 flex flex-col items-end gap-1.5">
            <button
              onClick={() => setImmersive(!immersive)}
              className={`w-9 h-9 rounded-lg flex items-center justify-center text-base ${controlCls} hover:text-primary transition-colors`}
              title={immersive ? "Exit full screen (Esc)" : "Full screen immersive"}
            >
              {immersive ? "✕" : "⛶"}
            </button>
            <div className={`px-2 py-1 rounded-md text-[0.55rem] font-mono ${isFocus ? "bg-[#222] text-[#666]" : "bg-[rgba(10,10,30,0.5)] text-white/30"}`}>
              {zoom.get().toFixed(1)}×
            </div>
          </div>

          {/* ── Bottom center: snapshot orb ───────────────────── */}
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

          {/* ── Immersive mode: exit hint ─────────────────────── */}
          <AnimatePresence>
            {immersive && hudVisible && (
              <motion.div
                className={`absolute top-3 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-xs ${controlDimCls}`}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono text-[0.6rem] mx-0.5">Esc</kbd> or ✕ to exit
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* ── Legend (hidden in immersive) ──────────────────────── */}
      {!immersive && (
        <div className={`mt-4 flex flex-wrap justify-center items-center gap-x-5 gap-y-1 text-[0.6rem] ${isFocus ? "text-[#666]" : "text-text-muted/40"}`}>
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
          <span className="opacity-50">Scroll to zoom · Drag to pan · Click a week · ⛶ for immersive</span>
        </div>
      )}

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
      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
    </>
  );
};

export default ResonanceGrid;
