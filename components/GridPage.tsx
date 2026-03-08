import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { addWeeks, format } from "date-fns";
import type { LifeStats, DiaryMap, SelectedWeek, HoverInfo } from "../types";

import WeeksGrid from "./WeeksGrid";
import DiaryModal from "./DiaryModal";
import DiaryList from "./DiaryList";
import LifeBattery from "./LifeBattery";
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
  const [isListOpen, setIsListOpen] = useState(false);

  const gridRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

  const openDiaryForWeek = useCallback(
    (weekIndex: number, row?: number, col?: number) => {
      const birth = new Date(birthdate);
      if (isNaN(birth.getTime())) return;
      const r = row ?? Math.floor(weekIndex / 52);
      const c = col ?? weekIndex % 52;
      setSelectedWeek({ index: weekIndex, row: r, col: c, date: format(addWeeks(birth, weekIndex), "MMM d, yyyy") });
      setIsModalOpen(true);
    },
    [birthdate],
  );

  const closeDiary = useCallback(() => { setIsModalOpen(false); setSelectedWeek(null); }, []);

  async function handleDelete(weekIndex: number) {
    await onSaveDiary(weekIndex, ""); // empty content triggers delete
  }

  const currentEntry = selectedWeek ? diaryEntries[selectedWeek.index.toString()] ?? "" : "";
  const pct = parseFloat(lifeStats.percentageLived);
  const entryCount = Object.keys(diaryEntries).length;

  return (
    <motion.div
      ref={containerRef}
      className="flex flex-col gap-6 w-full"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: 30 }}
      transition={{ duration: 0.3 }}
    >
      {/* Info bar */}
      <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 glass rounded-xl p-3 sm:p-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted">Life Remaining</span>
          <LifeBattery percentUsed={pct} size="sm" />
        </div>
        <div className="h-4 w-px bg-box-border hidden sm:block" />
        <span className="text-xs text-text-muted">
          Week <strong className="text-white">{lifeStats.currentWeekInYear}</strong> of Year <strong className="text-white">{lifeStats.currentYearOfLife}</strong>
        </span>
        <div className="h-4 w-px bg-box-border hidden sm:block" />
        {entryCount > 0 && (
          <button
            onClick={() => setIsListOpen(true)}
            className="text-xs text-primary hover:text-white transition-colors flex items-center gap-1"
          >
            📖 <span className="font-medium">{entryCount} {entryCount === 1 ? "entry" : "entries"}</span>
          </button>
        )}
      </div>

      {/* Grid */}
      <div ref={gridRef}>
        <WeeksGrid
          weeksPassed={lifeStats.weeksPassed}
          totalYears={lifeExpectancy}
          birthdate={birthdate}
          onHover={setHoverInfo}
          onWeekClick={(idx, row, col) => openDiaryForWeek(idx, row, col)}
          diaryEntries={diaryEntries}
          scale={scale}
        />
      </div>

      {/* Legend */}
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
      <DiaryModal isOpen={isModalOpen} onClose={closeDiary} selectedWeek={selectedWeek} initialEntryText={currentEntry} onSave={onSaveDiary} />
      <DiaryList isOpen={isListOpen} onClose={() => setIsListOpen(false)} diaryEntries={diaryEntries} birthdate={birthdate} onEdit={openDiaryForWeek} onDelete={handleDelete} />
    </motion.div>
  );
};

export default GridPage;
