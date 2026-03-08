import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { addWeeks, format } from "date-fns";
import type { LifeStats, DiaryMap, SelectedWeek, HoverInfo } from "../types";

import WeeksGrid from "./WeeksGrid";
import DiaryModal from "./DiaryModal";
import Tooltip from "./Tooltip";

interface GridPageProps {
  lifeStats: LifeStats;
  birthdate: string;
  lifeExpectancy: number;
  diaryEntries: DiaryMap;
  onSaveDiary: (weekIndex: number, content: string) => Promise<void>;
}

const GridPage: React.FC<GridPageProps> = ({ lifeStats, birthdate, lifeExpectancy, diaryEntries, onSaveDiary }) => {
  const [scale, setScale] = useState(1);
  const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<SelectedWeek | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const gridRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  /* ── Auto-scale grid ──────────────────────────────────────── */
  useEffect(() => {
    function resize() {
      if (!gridRef.current || !containerRef.current) return;
      const grid = gridRef.current.querySelector(".inline-flex");
      if (!grid) return;

      const style = window.getComputedStyle(containerRef.current);
      const available = containerRef.current.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
      const gridWidth = grid.scrollWidth;

      setScale(gridWidth > available && available > 0 ? Math.min(1, parseFloat((available / gridWidth).toFixed(3))) : 1);
    }

    resize();
    let t: number;
    const debounced = () => { clearTimeout(t); t = window.setTimeout(resize, 150); };
    window.addEventListener("resize", debounced);
    return () => window.removeEventListener("resize", debounced);
  }, [birthdate, lifeExpectancy]);

  /* ── Diary handlers ───────────────────────────────────────── */
  const openDiary = useCallback(
    (weekIndex: number, row: number, col: number) => {
      const birth = new Date(birthdate);
      if (isNaN(birth.getTime())) return;
      setSelectedWeek({ index: weekIndex, row, col, date: format(addWeeks(birth, weekIndex), "MMM d, yyyy") });
      setIsModalOpen(true);
    },
    [birthdate],
  );

  const closeDiary = useCallback(() => {
    setIsModalOpen(false);
    setSelectedWeek(null);
  }, []);

  const currentEntry = selectedWeek ? diaryEntries[selectedWeek.index.toString()] ?? "" : "";
  const pct = parseFloat(lifeStats.percentageLived);

  return (
    <motion.div
      ref={containerRef}
      className="flex flex-col gap-6 w-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, x: 30 }}
      transition={{ duration: 0.3 }}
    >
      {/* ── Info bar ─────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 glass rounded-xl p-3 sm:p-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted">Life Progress</span>
          <div className="w-32 h-2 bg-[rgba(255,255,255,0.05)] rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary to-accent rounded-full" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-xs font-bold text-primary counter-digits">{lifeStats.percentageLived}%</span>
        </div>
        <div className="h-4 w-px bg-box-border hidden sm:block" />
        <span className="text-xs text-text-muted">
          Week <strong className="text-white">{lifeStats.currentWeekInYear}</strong> of Year <strong className="text-white">{lifeStats.currentYearOfLife}</strong>
        </span>
        <div className="h-4 w-px bg-box-border hidden sm:block" />
        <span className="text-xs text-text-muted">
          <strong className="text-white">{lifeStats.weeksPassed.toLocaleString()}</strong> weeks lived
        </span>
      </div>

      {/* ── Grid ─────────────────────────────────────────────── */}
      <div ref={gridRef}>
        <WeeksGrid
          weeksPassed={lifeStats.weeksPassed}
          totalYears={lifeExpectancy}
          birthdate={birthdate}
          onHover={setHoverInfo}
          onWeekClick={openDiary}
          diaryEntries={diaryEntries}
          scale={scale}
        />
      </div>

      {/* ── Legend ────────────────────────────────────────────── */}
      <div className="flex flex-wrap justify-center items-center gap-x-5 gap-y-2 text-xs text-text-muted">
        {[
          { label: "Past",    cls: "bg-primary shadow-sm shadow-primary/30" },
          { label: "Current", cls: "bg-accent shadow-md shadow-accent/40" },
          { label: "Future",  cls: "bg-bg-light" },
          { label: "Diary",   cls: "bg-bg-light relative after:content-['📝'] after:absolute after:text-[7px] after:top-1/2 after:left-1/2 after:-translate-x-1/2 after:-translate-y-1/2" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <span className={`inline-block w-3.5 h-3.5 border border-box-border rounded-sm ${item.cls}`} />
            {item.label}
          </div>
        ))}
      </div>

      <Tooltip hoverInfo={hoverInfo} />
      <DiaryModal
        isOpen={isModalOpen}
        onClose={closeDiary}
        selectedWeek={selectedWeek}
        initialEntryText={currentEntry}
        onSave={onSaveDiary}
      />
    </motion.div>
  );
};

export default GridPage;
