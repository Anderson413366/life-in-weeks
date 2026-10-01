import React, { Suspense, lazy, useState, useMemo, useCallback } from "react";
import { addWeeks, format } from "date-fns";
import { useNavigate } from "react-router-dom";
import type { DiaryEntry, DiaryMap, SelectedWeek } from "@/modules/diary";
import type { MoodEntry } from "@/modules/mood";
import type { AppMode } from "@/modules/preferences";
import { Button, InfoCard, QuoteBlock, SegmentedControl, Surface } from "@/shared/ui/components";
import { parseStoredDate } from "@/shared/lib";

import type { LifeStats } from "../../types/life.types";
import LifeBattery from "../components/LifeBattery";

const DiaryModal = lazy(() => import("@/modules/diary/ui/components/DiaryModal"));
const LegacySnapshot = lazy(() => import("../components/LegacySnapshot"));

type GridMode = "weeks" | "months" | "years";

interface LifeGridPageProps {
  lifeStats: LifeStats;
  birthdate: string;
  lifeExpectancy: number;
  diaryEntries: DiaryMap;
  fullEntries: DiaryEntry[];
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

const MODE_LABELS: { key: GridMode; label: string }[] = [
  { key: "weeks", label: "Weeks" },
  { key: "months", label: "Months" },
  { key: "years", label: "Years" },
];

const MODE_DESCRIPTIONS: Record<GridMode, string> = {
  weeks: "The most detailed view. Each cell represents one week and can open its journal entry.",
  months: "A compressed scan of your life by month, useful for seeing pace and density at a glance.",
  years: "The highest-level view for decade framing and long-range perspective.",
};

const LifeGridPage: React.FC<LifeGridPageProps> = ({
  lifeStats, birthdate, lifeExpectancy, diaryEntries, fullEntries, userId, mode, todayMood, displayName, onSaveDiary,
}) => {
  const [gridMode, setGridMode] = useState<GridMode>("weeks");
  const [selectedWeek, setSelectedWeek] = useState<SelectedWeek | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showSnapshot, setShowSnapshot] = useState(false);
  const navigate = useNavigate();

  const birth = useMemo(() => parseStoredDate(birthdate), [birthdate]);
  const birthYear = birth?.getFullYear() ?? (Number(birthdate.split("-")[0]) || new Date().getFullYear());
  const pct = parseFloat(lifeStats.percentageLived);

  const weeksPassed = lifeStats.weeksPassed;
  const now = useMemo(() => new Date(), [lifeStats.currentDateFormatted]);
  const monthsPassed = useMemo(() => {
    if (!birth) return 0;
    return (now.getFullYear() - birthYear) * 12 + (now.getMonth() - birth.getMonth());
  }, [now, birthYear, birth]);
  const yearsPassed = useMemo(() => now.getFullYear() - birthYear, [now, birthYear]);

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
    if (!birth) return;
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
    const accent = isFocus ? "#ffffff" : ACCENT[gridMode];
    const current = isFocus ? "#ffffff" : CURRENT_C[gridMode];
    const passed = gridMode === "weeks" ? weeksPassed : gridMode === "months" ? monthsPassed : yearsPassed;

    if (index < passed) return { bg: accent, shadow: `0 0 4px ${accent}88`, border: "none", scale: false };
    if (index === passed) return { bg: current, shadow: `0 0 10px ${current}88`, border: "none", scale: true };
    return { bg: "transparent", shadow: "none", border: `1px solid ${accent}33`, scale: false };
  }

  function getRowLabel(rowIndex: number): string {
    if (gridMode === "weeks") return `${rowIndex}`;
    if (gridMode === "months") return `${rowIndex}`;
    return `${birthYear + rowIndex * 10}s`;
  }

  const currentEntry = selectedWeek ? diaryEntries[selectedWeek.index.toString()] ?? "" : "";
  const currentPhotos = selectedWeek ? fullEntries.find((e) => e.week_index === selectedWeek.index)?.photos ?? [] : [];
  const entryCount = Object.keys(diaryEntries).length;
  const [bYear, bMonth, bDay] = birthdate.split("-").map(Number);
  const overlayFallback = <div className="text-xs text-white/40 text-center py-4">Loading…</div>;
  const isFocus = mode === "focus";
  const accentColor = isFocus ? "#ffffff" : ACCENT[gridMode];
  const currentColor = isFocus ? "#ffffff" : CURRENT_C[gridMode];
  const mutedLabel = isFocus ? "rgba(255,255,255,0.65)" : "#8899aa";
  const columnColor = isFocus ? "rgba(255,255,255,0.45)" : "rgba(0, 212, 255, 0.35)";

  return (
    <div className="flex flex-col w-full min-h-screen pb-16 animate-fade-in">
      <div className="grid-console">
        {/* Title */}
        <div className="mb-4 text-center">
          <p className="eyebrow justify-center">Life Grid</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Your life in {gridMode}.
          </h1>
          <p className={`text-sm mt-2 ${isFocus ? "text-white/70" : "text-white/60"}`}>
            {stat.lived.toLocaleString()} {stat.unit} lived · {(stat.total - stat.lived).toLocaleString()} remaining · {Math.round((stat.lived / stat.total) * 100)}%
          </p>
        </div>

        {/* Battery + controls */}
        <div className="flex items-center justify-center gap-4 mb-3">
          <LifeBattery percentUsed={pct} size="sm" />
          <Button onClick={() => setShowSnapshot(true)} aria-label="Open snapshot modal" size="sm" variant="quiet">Snapshot</Button>
        </div>

        <div className="mb-4 flex flex-wrap justify-center gap-2">
          <Button onClick={() => openDiary(weeksPassed)} variant="primary" size="sm">
            Capture this week
          </Button>
          <Button onClick={() => navigate("/diary")} size="sm">
            Open diary
          </Button>
          <Button onClick={() => setShowSnapshot(true)} size="sm">
            Share snapshot
          </Button>
        </div>

        {/* Mode Switcher */}
        <div className="mb-3 flex justify-center">
          <SegmentedControl
            value={gridMode}
            onChange={setGridMode}
            label="Life grid scale"
            items={MODE_LABELS.map(({ key, label }) => ({
              value: key,
              label,
              description: MODE_DESCRIPTIONS[key],
            }))}
          />
        </div>

        {/* Legend */}
        <div className="flex justify-center gap-4 sm:gap-6">
        {[
          { label: "Lived", color: accentColor },
          { label: "Now", color: currentColor },
          { label: "Future", color: "#ffffff22" },
        ].map(({ label, color }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{
              backgroundColor: color,
              border: label === "Future" ? `1px solid ${accentColor}44` : "none",
            }} />
            <span className="text-xs" style={{ color: mutedLabel }}>{label}</span>
          </div>
        ))}
        {entryCount > 0 && (
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-[#fbbf24]" />
            <span className="text-xs" style={{ color: mutedLabel }}>Diary ({entryCount})</span>
          </div>
        )}
      </div>

      <Surface variant="inset" className="mt-4 px-4 py-3 text-left">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="max-w-2xl">
            <p className={`text-[0.68rem] uppercase tracking-[0.2em] ${isFocus ? "text-white/55" : "text-white/35"}`}>Current View</p>
            <p className={`mt-1 text-sm ${isFocus ? "text-white/82" : "text-white/75"}`}>{MODE_DESCRIPTIONS[gridMode]}</p>
          </div>
          <div className="chip">
            <span className="text-[0.62rem] uppercase tracking-[0.18em] text-white/45">Memory</span>
            <span className="text-sm text-white">{entryCount} saved week{entryCount === 1 ? "" : "s"}</span>
          </div>
        </div>
      </Surface>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <InfoCard title="Now" description={`You are in year ${lifeStats.currentYearOfLife}, week ${lifeStats.currentWeekInYear}.`} tone="accent" />
        <InfoCard title="Written memory" description={`${entryCount} journal entr${entryCount === 1 ? "y is" : "ies are"} attached to the grid.`} />
        <InfoCard title="Zoom level" description={MODE_DESCRIPTIONS[gridMode]} />
      </div>
      </div>{/* end sticky header */}

      {/* Grid */}
      <div className="overflow-x-auto px-4 pb-8">
        <div
          className="flex flex-col mx-auto"
          style={{ gap: `${GAP[gridMode]}px`, width: "fit-content" }}
          role="grid"
          aria-label={`Life in ${gridMode}. ${MODE_DESCRIPTIONS[gridMode]}`}
        >
          {/* Column header row — week/month numbers */}
          {(gridMode === "weeks" || gridMode === "months") && (
            <div className="flex items-center" style={{ gap: `${GAP[gridMode]}px` }} role="row">
              <div style={{ width: 32, minWidth: 32 }} />
              {Array.from({ length: cols }, (_, i) => (
                <div key={i} className="flex items-center justify-center shrink-0 select-none" style={{
                  width: CELL[gridMode], height: CELL[gridMode] * 0.8, minWidth: CELL[gridMode],
                  fontSize: gridMode === "weeks" ? "0.4rem" : "0.5rem",
                  color: columnColor,
                  fontWeight: 600,
                }} role="columnheader" aria-label={`${gridMode === "weeks" ? "Week" : "Month"} ${i + 1}`}>
                  {i + 1}
                </div>
              ))}
            </div>
          )}
          {Array.from({ length: rows }, (_, rowIndex) => {
            const rowLabel = getRowLabel(rowIndex);
            return (
              <div key={rowIndex} className="flex items-center" style={{ gap: `${GAP[gridMode]}px` }} role="row">
                {/* Row label — year number */}
                <div className="text-right select-none" style={{
                  width: 28, minWidth: 28,
                  fontSize: "0.55rem",
                  color: rowIndex % 10 === 0 ? (isFocus ? "rgba(255,255,255,0.85)" : "rgba(0, 212, 255, 0.7)") : columnColor,
                  fontWeight: rowIndex % 10 === 0 ? 700 : 500,
                  fontVariantNumeric: "tabular-nums",
                  lineHeight: `${CELL[gridMode]}px`,
                }} aria-hidden="true">
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
                  const cellLabel = gridMode === "weeks"
                    ? `Year ${rowIndex}, week ${colIndex + 1}. ${hasDiary ? "Has a journal entry." : "No journal entry yet."} ${isClickable ? "Open week journal." : "Future week."}`
                    : gridMode === "months"
                    ? `Year ${Math.floor(cellIndex / 12)}, month ${colIndex + 1}. ${isClickable ? "Open the mapped week journal." : "Future month."}`
                    : `${yearValue}. ${isClickable ? "Open the first week for this year." : "Future year."}`;

                  return (
                    <button
                      key={colIndex}
                      type="button"
                      onClick={() => isClickable && handleCellClick(cellIndex)}
                      title={gridMode === "weeks" ? `Week ${(cellIndex % 52) + 1}, Year ${Math.floor(cellIndex / 52)}` : gridMode === "months" ? `Month ${(cellIndex % 12) + 1}, Year ${Math.floor(cellIndex / 12)}` : `${yearValue}`}
                      className="relative flex shrink-0 items-center justify-center transition-transform duration-150 focus:outline-none focus:ring-2 focus:ring-primary"
                      style={{
                        width: CELL[gridMode], height: CELL[gridMode], minWidth: CELL[gridMode],
                        borderRadius: RADIUS[gridMode],
                        backgroundColor: bg, boxShadow: shadow, border,
                        transform: scale ? "scale(1.15)" : "none",
                        zIndex: scale ? 1 : 0,
                        cursor: isClickable ? "pointer" : "not-allowed",
                        opacity: isClickable ? 1 : 0.8,
                      }}
                      disabled={!isClickable}
                      aria-label={cellLabel}
                      aria-current={cellIndex === passed ? "date" : undefined}
                    >
                      {/* Year number inside years cells */}
                      {isYear && (
                        <span className="select-none pointer-events-none" style={{
                          fontSize: "0.5rem", fontWeight: 700, lineHeight: 1,
                          color: bg !== "transparent" ? "rgba(0,0,0,0.6)" : "rgba(0, 212, 255, 0.35)",
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
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom hint */}
      <p className="text-center text-[#334466] text-xs pb-2 select-none">
        Each cell = one {gridMode === "weeks" ? "week" : gridMode === "months" ? "month" : "year"} of your life · Click any past cell to journal
      </p>

      <div className="px-4 pb-6">
        <QuoteBlock />
      </div>

      {isModalOpen && (
        <Suspense fallback={overlayFallback}>
          <DiaryModal
            isOpen={isModalOpen}
            onClose={closeDiary}
            selectedWeek={selectedWeek}
            initialEntryText={currentEntry}
            initialPhotos={currentPhotos}
            userId={userId}
            onSave={onSaveDiary}
          />
        </Suspense>
      )}
      {showSnapshot && (
        <Suspense fallback={overlayFallback}>
          <LegacySnapshot isOpen={showSnapshot} onClose={() => setShowSnapshot(false)}
            lifeStats={lifeStats} birthYear={bYear} birthMonth={bMonth} birthDay={bDay}
            displayName={displayName} todayMood={todayMood} />
        </Suspense>
      )}
    </div>
  );
};

export default LifeGridPage;
