import React, { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { addWeeks, differenceInWeeks, format } from "date-fns";
import type { DiaryMap, SelectedWeek } from "../types";
import type { FullDiaryEntry } from "../hooks/useDiary";
import DiaryModal from "./DiaryModal";
import SectionHeading from "./SectionHeading";

interface DiaryPageProps {
  fullEntries: FullDiaryEntry[];
  diaryEntries: DiaryMap;
  birthdate: string;
  userId?: string;
  onSave: (weekIndex: number, content: string, photos?: string[]) => Promise<void>;
}

type ViewMode = "card" | "list";
type SortOrder = "newest" | "oldest";

const DiaryPage: React.FC<DiaryPageProps> = ({ fullEntries, diaryEntries, birthdate, userId, onSave }) => {
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("card");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [selectedWeek, setSelectedWeek] = useState<SelectedWeek | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [newEntryDate, setNewEntryDate] = useState(() => new Date().toISOString().split("T")[0]);

  const birth = useMemo(() => new Date(birthdate), [birthdate]);

  const yearOptions = useMemo(() => {
    const years = new Set(fullEntries.map((e) => Math.floor(e.week_index / 52)));
    return Array.from(years).sort((a, b) => b - a);
  }, [fullEntries]);

  const filtered = useMemo(() => {
    let list = fullEntries.map((e) => {
      const row = Math.floor(e.week_index / 52);
      const col = e.week_index % 52;
      const weekDate = addWeeks(birth, e.week_index);
      return { ...e, row, col, date: format(weekDate, "MMM d, yyyy"), dateObj: weekDate };
    });
    if (yearFilter !== "all") {
      const y = parseInt(yearFilter, 10);
      list = list.filter((e) => e.row === y);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((e) => e.content.toLowerCase().includes(q) || e.date.toLowerCase().includes(q));
    }
    list.sort((a, b) => sortOrder === "newest" ? b.week_index - a.week_index : a.week_index - b.week_index);
    return list;
  }, [fullEntries, birth, yearFilter, search, sortOrder]);

  const openModalForWeek = useCallback((weekIndex: number) => {
    if (isNaN(birth.getTime())) return;
    const row = Math.floor(weekIndex / 52);
    const col = weekIndex % 52;
    setSelectedWeek({ index: weekIndex, row, col, date: format(addWeeks(birth, weekIndex), "MMM d, yyyy") });
    setIsModalOpen(true);
  }, [birth]);

  const closeModal = useCallback(() => { setIsModalOpen(false); setSelectedWeek(null); }, []);

  function handleNewEntry() {
    const date = new Date(newEntryDate + "T12:00:00");
    if (isNaN(date.getTime()) || isNaN(birth.getTime())) return;
    const weekIndex = Math.max(0, differenceInWeeks(date, birth));
    openModalForWeek(weekIndex);
    setShowNewEntry(false);
  }

  async function handleDelete(weekIndex: number) {
    await onSave(weekIndex, "");
    setConfirmDelete(null);
  }

  const currentEntry = selectedWeek ? diaryEntries[selectedWeek.index.toString()] ?? "" : "";
  const currentPhotos = selectedWeek ? fullEntries.find((e) => e.week_index === selectedWeek.index)?.photos ?? [] : [];

  return (
    <motion.div
      className="flex flex-col gap-6 w-full max-w-4xl mx-auto"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <SectionHeading title="My Diary" />

      {/* Toolbar */}
      <div className="glass rounded-xl p-3 sm:p-4 flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="flex gap-2 w-full sm:w-auto">
            <input
              type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search entries..."
              className="h-9 flex-1 sm:w-56 rounded-lg border border-box-border bg-transparent px-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
            />
            <button onClick={() => setShowNewEntry(!showNewEntry)}
              className="h-9 px-3 rounded-lg bg-primary/20 text-primary border border-primary/30 text-xs font-medium hover:bg-primary/30 transition-colors shrink-0">
              + New Entry
            </button>
          </div>
          <div className="flex gap-2 items-center">
            <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)}
              className="h-9 rounded-lg border border-box-border bg-transparent px-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-primary/40 appearance-none cursor-pointer">
              <option value="all" className="bg-bg-dark">All Years</option>
              {yearOptions.map((y) => <option key={y} value={y} className="bg-bg-dark">Year {y}</option>)}
            </select>
            <button onClick={() => setSortOrder(sortOrder === "newest" ? "oldest" : "newest")}
              className="h-9 px-3 rounded-lg border border-box-border text-xs text-text-muted hover:text-white transition-colors">
              {sortOrder === "newest" ? "↓ New" : "↑ Old"}
            </button>
            <div className="flex p-0.5 glass rounded-lg">
              {(["card", "list"] as ViewMode[]).map((m) => (
                <button key={m} onClick={() => setViewMode(m)}
                  className={`px-2.5 py-1 rounded-md text-xs transition-colors ${viewMode === m ? "bg-primary/15 text-primary" : "text-text-muted hover:text-white"}`}>
                  {m === "card" ? "▦" : "☰"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* New entry date picker */}
        <AnimatePresence>
          {showNewEntry && (
            <motion.div
              className="flex items-center justify-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/15"
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            >
              <span className="text-xs text-text-muted">Entry date:</span>
              <input
                type="date" value={newEntryDate} onChange={(e) => setNewEntryDate(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
                min={birthdate}
                className="h-9 rounded-lg border border-box-border bg-transparent px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
              />
              <button onClick={handleNewEntry}
                className="h-9 px-4 rounded-lg bg-primary hover:bg-primary-dark text-bg-dark text-xs font-semibold transition-colors">
                Create
              </button>
              <button onClick={() => setShowNewEntry(false)} className="text-xs text-text-muted hover:text-white">Cancel</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="text-xs text-text-muted/60 text-center">
        {filtered.length} {filtered.length === 1 ? "entry" : "entries"}{search && ` matching "${search}"`}
      </div>

      {/* Entries */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-6">
          {search ? (
            <>
              <div className="text-5xl opacity-20">🔍</div>
              <p className="text-text-muted">No entries match "{search}"</p>
            </>
          ) : (
            <>
              {/* Large voice journal CTA */}
              <motion.div
                className="flex flex-col items-center gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <motion.button
                  onClick={() => { setShowNewEntry(true); }}
                  className="w-24 h-24 rounded-full flex items-center justify-center text-4xl shadow-2xl"
                  style={{
                    background: "linear-gradient(135deg, #00d4ff, #8e44ad, #ff6b6b)",
                    boxShadow: "0 0 40px rgba(0,212,255,0.2), 0 0 80px rgba(142,68,173,0.1)",
                  }}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.95 }}
                  animate={{ scale: [1, 1.03, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  ✍️
                </motion.button>
                <div className="text-center">
                  <p className="text-white font-medium text-lg">Start Your Story</p>
                  <p className="text-text-muted/60 text-sm mt-1">Your life deserves to be documented.</p>
                  <p className="text-text-muted/40 text-xs mt-0.5">Write, speak, or snap a photo — it all starts here.</p>
                </div>
              </motion.div>
            </>
          )}
        </div>
      ) : viewMode === "card" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <AnimatePresence>
            {filtered.map((e, i) => (
              <motion.div key={e.week_index} className="glass glass-hover rounded-xl p-4 flex flex-col gap-2 group"
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: Math.min(i * 0.03, 0.3) }}>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-primary">Week {e.col + 1}, Year {e.row}</span>
                    <span className="text-[0.6rem] text-text-muted ml-2">{e.date}</span>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openModalForWeek(e.week_index)} className="w-7 h-7 rounded-md bg-primary/10 text-primary hover:bg-primary/20 text-xs flex items-center justify-center">✏️</button>
                    <button
                      onClick={() => confirmDelete === e.week_index ? handleDelete(e.week_index) : setConfirmDelete(e.week_index)}
                      className={`w-7 h-7 rounded-md text-xs flex items-center justify-center ${confirmDelete === e.week_index ? "bg-accent/30 text-accent" : "bg-accent/10 text-accent hover:bg-accent/20"}`}>
                      🗑
                    </button>
                  </div>
                </div>
                <p className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap line-clamp-5">{e.content}</p>
                {e.photos.length > 0 && (
                  <div className="flex gap-1.5 mt-1 overflow-x-auto">
                    {e.photos.map((url, pi) => (
                      <img key={pi} src={url} alt="" className="w-16 h-16 rounded-lg object-cover border border-box-border shrink-0" />
                    ))}
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((e, i) => (
            <motion.div key={e.week_index} className="glass rounded-lg px-4 py-3 flex items-center gap-4 group"
              initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(i * 0.02, 0.3) }}>
              <div className="w-24 shrink-0">
                <div className="text-xs font-semibold text-primary">Wk {e.col + 1}, Yr {e.row}</div>
                <div className="text-[0.55rem] text-text-muted">{e.date}</div>
              </div>
              <p className="flex-1 text-sm text-white/80 truncate">{e.content}</p>
              {e.photos.length > 0 && <span className="text-xs text-text-muted/50">📷 {e.photos.length}</span>}
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <button onClick={() => openModalForWeek(e.week_index)} className="w-7 h-7 rounded-md bg-primary/10 text-primary hover:bg-primary/20 text-xs flex items-center justify-center">✏️</button>
                <button onClick={() => confirmDelete === e.week_index ? handleDelete(e.week_index) : setConfirmDelete(e.week_index)}
                  className={`w-7 h-7 rounded-md text-xs flex items-center justify-center ${confirmDelete === e.week_index ? "bg-accent/30 text-accent" : "bg-accent/10 text-accent hover:bg-accent/20"}`}>🗑</button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <DiaryModal
        isOpen={isModalOpen}
        onClose={closeModal}
        selectedWeek={selectedWeek}
        initialEntryText={currentEntry}
        initialPhotos={currentPhotos}
        userId={userId}
        onSave={onSave}
      />
    </motion.div>
  );
};

export default DiaryPage;
