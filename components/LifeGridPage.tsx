import React, { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { addWeeks, format } from "date-fns";
import type { LifeStats, DiaryMap, SelectedWeek } from "../types";
import type { AppMode } from "../lib/theme";
import type { FullDiaryEntry } from "../hooks/useDiary";
import type { MoodEntry } from "../hooks/useMood";
import LifeBattery from "./LifeBattery";
import WeekModal from "./WeekModal";
import LegacySnapshot from "./LegacySnapshot";
import HelpModal from "./HelpModal";

type GridMode = "weeks" | "months" | "years";

interface LifeGridPageProps {
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

const COLS: Record<GridMode, number> = { weeks: 52, months: 12, years: 10 };
const CELL: Record<GridMode, number> = { weeks: 14, months: 26, years: 52 };
const GAP: Record<GridMode, number> = { weeks: 3, months: 4, years: 5 };
const RADIUS: Record<GridMode, number> = { weeks: 2, months: 5, years: 8 };
const ACCENT: Record<GridMode, string> = { weeks: "#00d4ff", months: "#00ff9d", years: "#bf5fff" };
const CURRENT_C: Record<GridMode, string> = { weeks: "#ec4899", months: "#ff6b00", years: "#ffd700" };

const MODE_LABELS: { key: GridMode; icon: string; label: string }[] = [
  { key: "weeks", icon: "■", label: "Weeks" },
  { key: "months", icon: "●", label: "Months" },
  { key: "years", icon: "◆", label: "Years" },
];

const LifeGridPage: React.FC<LifeGridPageProps> = ({
  lifeStats, birthdate, lifeExpectancy, diaryEntries, fullEntries, userId, mode: _mode, todayMood, displayName, onSaveDiary,
}) => {
  const [gridMode, setGridMode] = useState<GridMode>("weeks");
  const [selectedWeek, setSelectedWeek] = useState<SelectedWeek | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showSnapshot, setShowSnapshot] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const birth = useMemo(() => new Date(birthdate), [birthdate]);
  const birthYear = birth.getFullYear();
  const pct = parseFloat(lifeStats.percentageLived);

  const weeksPassed = lifeStats.weeksPassed;
  const monthsPassed = (new Date().getFullYear() - birthYear) * 12 + (new Date().getMonth() - birth.getMonth());
  const yearsPassed = new Date().getFullYear() - birthYear;

  const totalWeeks = lifeExpectancy * 52;
  const totalMonths = lifeExpectancy * 12;
  const totalYears = lifeExpectancy;

  const stat = gridMode === "weeks"
    ? { lived: weeksPassed, total: totalWeeks, unit: "weeks" }
    : gridMode === "months"
    ? { lived: monthsPassed, total: totalMonths, unit: "months" }
    : { lived: yearsPassed, total: totalYears, unit: "years" };

  const cols = COLS[gridMode];
  const total = stat.total;
  const rows = Math.ceil(total / cols);

  const openDiary = useCallback((weekIndex: number) => {
    const row = Math.floor(weekIndex / 52);
    const col = weekIndex % 52;
    setSelectedWeek({ index: weekIndex, row, col, date: format(addWeeks(birth, weekIndex), "MMM d, yyyy") });
    setIsModalOpen(true);
  }, [birth]);

  const closeDiary = useCallback(() => { setIsModalOpen(false); setSelectedWeek(null); }, []);

  function handleCellClick(cellIndex: number) {
    let weekIdx = cellIndex;
    if (gridMode === "months") weekIdx = Math.floor(cellIndex * 52 / 12);
    else if (gridMode === "years") weekIdx = cellIndex * 52;
    if (weekIdx <= weeksPassed) openDiary(weekIdx);
  }

  function getCellColor(index: number): { bg: string; shadow: string; border: string; scale: boolean } {
    const accent = ACCENT[gridMode];
    const current = CURRENT_C[gridMode];
    const passed = gridMode === "weeks" ? weeksPassed : gridMode === "months" ? monthsPassed : yearsPassed;

    if (index < passed) return { bg: accent, shadow: `0 0 4px ${accent}88`, border: "none", scale: false };
    if (index === passed) return { bg: current, shadow: `0 0 10px ${current}88`, border: "none", scale: true };
    return { bg: "transparent", shadow: "none", border: `1px solid ${accent}33`, scale: false };
  }

  function getRowLabel(rowIndex: number): string {
    if (gridMode === "weeks") return rowIndex % 5 === 0 ? `${rowIndex}` : "";
    if (gridMode === "months") return `${rowIndex}`;
    return `${birthYear + rowIndex * 10}s`;
  }

  const currentEntry = selectedWeek ? diaryEntries[selectedWeek.index.toString()] ?? "" : "";
  const currentPhotos = selectedWeek ? fullEntries.find((e) => e.week_index === selectedWeek.index)?.photos ?? [] : [];
  const entryCount = Object.keys(diaryEntries).length;
  const [bYear, bMonth, bDay] = birthdate.split("-").map(Number);

  return (
    <motion.div
      className="flex flex-col w-full"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ minHeight: "100vh", backgroundColor: "#080818", paddingBottom: 60 }}
    >
      {/* Header */}
      <div className="text-center pt-4 pb-2 px-4">
        <h1 className="text-xl font-black text-white tracking-wider uppercase">
          Your Life in <span style={{ color: ACCENT[gridMode] }}>{gridMode.toUpperCase()}</span>
        </h1>
        <p className="text-[#8899aa] text-xs mt-1">
          {stat.lived.toLocaleString()} {stat.unit} lived · {(stat.total - stat.lived).toLocaleString()} remaining · {Math.round((stat.lived / stat.total) * 100)}%
        </p>
      </div>

      {/* Battery + controls */}
      <div className="flex items-center justify-center gap-4 py-2">
        <LifeBattery percentUsed={pct} size="sm" />
        <button onClick={() => setShowSnapshot(true)} className="text-xs text-white/30 hover:text-white/60 transition-colors">📸</button>
        <button onClick={() => setShowHelp(true)} className="text-xs text-white/30 hover:text-white/60 transition-colors">?</button>
      </div>

      {/* Mode Switcher */}
      <div className="flex justify-center gap-2 py-4 px-4">
        {MODE_LABELS.map(({ key, icon, label }) => (
          <button
            key={key}
            onClick={() => setGridMode(key)}
            className="flex items-center gap-1.5 transition-all"
            style={{
              padding: "10px 24px",
              borderRadius: 100,
              border: gridMode === key ? "none" : `1px solid ${ACCENT[key]}44`,
              background: gridMode === key ? `linear-gradient(135deg, ${ACCENT[key]}cc, ${ACCENT[key]}66)` : "transparent",
              color: gridMode === key ? "#fff" : ACCENT[key],
              fontWeight: gridMode === key ? 700 : 500,
              fontSize: "0.85rem",
              boxShadow: gridMode === key ? `0 0 20px ${ACCENT[key]}44` : "none",
            }}
          >
            <span className="text-xs">{icon}</span> {label}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-6 pb-4 px-4">
        {[
          { label: "Lived", color: ACCENT[gridMode] },
          { label: "Now", color: CURRENT_C[gridMode] },
          { label: "Future", color: "#ffffff22" },
        ].map(({ label, color }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{
              backgroundColor: color,
              border: label === "Future" ? `1px solid ${ACCENT[gridMode]}44` : "none",
            }} />
            <span className="text-[#8899aa] text-xs">{label}</span>
          </div>
        ))}
        {entryCount > 0 && (
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-[#fbbf24]" />
            <span className="text-[#8899aa] text-xs">Diary ({entryCount})</span>
          </div>
        )}
      </div>

      {/* Grid */}
      <div className="overflow-x-auto px-4 pb-8">
        <div className="flex flex-col mx-auto" style={{ gap: `${GAP[gridMode]}px`, width: "fit-content" }}>
          {Array.from({ length: rows }, (_, rowIndex) => {
            const rowLabel = getRowLabel(rowIndex);
            return (
              <div key={rowIndex} className="flex items-center" style={{ gap: `${GAP[gridMode]}px` }}>
                {/* Row label */}
                <div className="text-right select-none" style={{
                  width: 32, minWidth: 32, fontSize: "0.6rem", color: "#4466aa",
                  fontVariantNumeric: "tabular-nums", lineHeight: `${CELL[gridMode]}px`,
                }}>
                  {rowLabel}
                </div>

                {/* Cells */}
                {Array.from({ length: cols }, (_, colIndex) => {
                  const cellIndex = rowIndex * cols + colIndex;
                  if (cellIndex >= total) return null;
                  const { bg, shadow, border, scale } = getCellColor(cellIndex);
                  const hasDiary = gridMode === "weeks" && !!diaryEntries[cellIndex.toString()];
                  const isYear = gridMode === "years";
                  const yearValue = birthYear + cellIndex;
                  const passed = gridMode === "weeks" ? weeksPassed : gridMode === "months" ? monthsPassed : yearsPassed;
                  const isClickable = cellIndex <= passed;

                  return (
                    <div
                      key={colIndex}
                      onClick={() => isClickable && handleCellClick(cellIndex)}
                      title={gridMode === "weeks" ? `Week ${(cellIndex % 52) + 1}, Year ${Math.floor(cellIndex / 52)}` : gridMode === "months" ? `Month ${(cellIndex % 12) + 1}, Year ${Math.floor(cellIndex / 12)}` : `${yearValue}`}
                      className="relative flex items-center justify-center shrink-0 transition-transform duration-150"
                      style={{
                        width: CELL[gridMode], height: CELL[gridMode], minWidth: CELL[gridMode],
                        borderRadius: RADIUS[gridMode],
                        backgroundColor: bg, boxShadow: shadow, border,
                        transform: scale ? "scale(1.15)" : "none",
                        zIndex: scale ? 1 : 0,
                        cursor: isClickable ? "pointer" : "default",
                      }}
                    >
                      {/* Year number inside years cells */}
                      {isYear && (
                        <span className="select-none pointer-events-none" style={{
                          fontSize: "0.5rem", fontWeight: 700, lineHeight: 1,
                          color: bg !== "transparent" ? "rgba(0,0,0,0.6)" : "#4466aa",
                        }}>
                          {yearValue}
                        </span>
                      )}
                      {/* Diary dot */}
                      {hasDiary && (
                        <div className="absolute" style={{
                          width: 4, height: 4, borderRadius: "50%", backgroundColor: "#fbbf24",
                          top: "50%", left: "50%", transform: "translate(-50%, -50%)",
                        }} />
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom hint */}
      <p className="text-center text-[#334466] text-xs pb-4 select-none">
        Each cell = one {gridMode === "weeks" ? "week" : gridMode === "months" ? "month" : "year"} of your life · Click any past cell to journal
      </p>

      <WeekModal isOpen={isModalOpen} onClose={closeDiary} week={selectedWeek}
        initialEntry={currentEntry} initialPhotos={currentPhotos}
        userId={userId} onSave={onSaveDiary} />
      <LegacySnapshot isOpen={showSnapshot} onClose={() => setShowSnapshot(false)}
        lifeStats={lifeStats} birthYear={bYear} birthMonth={bMonth} birthDay={bDay}
        displayName={displayName} todayMood={todayMood} />
      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
    </motion.div>
  );
};

export default LifeGridPage;
