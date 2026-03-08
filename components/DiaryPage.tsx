import React, { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { addWeeks, differenceInWeeks, format } from "date-fns";
import type { DiaryMap, SelectedWeek } from "../types";
import type { FullDiaryEntry } from "../hooks/useDiary";
import DiaryModal from "./DiaryModal";

interface DiaryPageProps {
  fullEntries: FullDiaryEntry[];
  diaryEntries: DiaryMap;
  birthdate: string;
  userId?: string;
  onSave: (weekIndex: number, content: string, photos?: string[]) => Promise<void>;
}

type ViewMode = "card" | "list";
type SortOrder = "newest" | "oldest";

const GLASS = "bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl";

const DiaryPage: React.FC<DiaryPageProps> = ({ fullEntries, diaryEntries, birthdate, userId, onSave }) => {
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("card");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [selectedWeek, setSelectedWeek] = useState<SelectedWeek | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [newEntryDate, setNewEntryDate] = useState(() => new Date().toISOString().split("T")[0]);

  const birth = useMemo(() => new Date(birthdate), [birthdate]);
  const hasEntries = fullEntries.length > 0;

  const yearOptions = useMemo(() => {
    const years = new Set(fullEntries.map((e) => Math.floor(e.week_index / 52)));
    return Array.from(years).sort((a, b) => b - a);
  }, [fullEntries]);

  const filtered = useMemo(() => {
    let list = fullEntries.map((e) => {
      const row = Math.floor(e.week_index / 52);
      const col = e.week_index % 52;
      return { ...e, row, col, date: format(addWeeks(birth, e.week_index), "MMM d, yyyy") };
    });
    if (yearFilter !== "all") list = list.filter((e) => e.row === parseInt(yearFilter, 10));
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

  function handleNewEntry() {
    const date = new Date(newEntryDate + "T12:00:00");
    if (isNaN(date.getTime()) || isNaN(birth.getTime())) return;
    openModalForWeek(Math.max(0, differenceInWeeks(date, birth)));
    setShowNewEntry(false);
  }

  function openCurrentWeek() {
    if (isNaN(birth.getTime())) return;
    openModalForWeek(differenceInWeeks(new Date(), birth));
  }

  const closeModal = useCallback(() => { setIsModalOpen(false); setSelectedWeek(null); }, []);
  const currentEntry = selectedWeek ? diaryEntries[selectedWeek.index.toString()] ?? "" : "";

  return (
    <motion.div
      className="flex flex-col gap-6 w-full max-w-4xl mx-auto"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      {/* ════════════════════════════════════════════════════════
          HERO CTA (when no entries OR always at top)
          ════════════════════════════════════════════════════════ */}
      {!hasEntries ? (
        /* Empty state — full-screen voice/write CTA */
        <div className="flex flex-col items-center justify-center py-24 gap-8">
          <motion.button
            onClick={openCurrentWeek}
            className="w-24 h-24 rounded-full flex items-center justify-center text-4xl shadow-2xl"
            style={{
              background: "linear-gradient(135deg, #ec4899, #8b5cf6)",
              boxShadow: "0 0 40px rgba(236,72,153,0.3), 0 0 80px rgba(139,92,246,0.15)",
            }}
            animate={{ boxShadow: [
              "0 0 40px rgba(236,72,153,0.3), 0 0 80px rgba(139,92,246,0.15)",
              "0 0 60px rgba(236,72,153,0.5), 0 0 100px rgba(139,92,246,0.25)",
              "0 0 40px rgba(236,72,153,0.3), 0 0 80px rgba(139,92,246,0.15)",
            ] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
          >
            🎙
          </motion.button>
          <div className="text-center">
            <p className="text-sm text-gray-400">Tap to capture this moment</p>
            <button
              onClick={() => setShowNewEntry(true)}
              className="mt-3 text-xs text-gray-500 hover:text-white transition-colors"
            >
              + Write Instead
            </button>
          </div>

          {/* Date picker for "Write Instead" */}
          <AnimatePresence>
            {showNewEntry && (
              <motion.div
                className={`${GLASS} p-4 flex items-center gap-3`}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
              >
                <input type="date" value={newEntryDate} onChange={(e) => setNewEntryDate(e.target.value)}
                  max={new Date().toISOString().split("T")[0]} min={birthdate}
                  className="h-9 rounded-xl border border-white/10 bg-transparent px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-pink-500/30" />
                <button onClick={handleNewEntry}
                  className="h-9 px-4 rounded-xl bg-pink-500/20 text-pink-300 border border-pink-500/20 text-xs font-medium hover:bg-pink-500/30 transition-colors">Create</button>
                <button onClick={() => setShowNewEntry(false)} className="text-xs text-gray-500 hover:text-white">Cancel</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        /* Has entries — compact CTA + toolbar + entries */
        <>
          {/* Compact top CTA */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.button
                onClick={openCurrentWeek}
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-lg"
                style={{ background: "linear-gradient(135deg, #ec4899, #8b5cf6)" }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                🎙
              </motion.button>
              <div>
                <p className="text-sm font-medium text-white">Capture a moment</p>
                <p className="text-[0.6rem] text-gray-500">{fullEntries.length} entries</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowNewEntry(!showNewEntry)}
                className="h-9 px-3 rounded-xl bg-white/5 border border-white/10 text-xs text-gray-400 hover:text-white transition-colors">
                + New
              </button>
              <button onClick={() => setShowSearch(!showSearch)}
                className="h-9 px-3 rounded-xl bg-white/5 border border-white/10 text-xs text-gray-400 hover:text-white transition-colors">
                🔍
              </button>
            </div>
          </div>

          {/* New entry date picker */}
          <AnimatePresence>
            {showNewEntry && (
              <motion.div className={`${GLASS} p-4 flex items-center justify-center gap-3`}
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                <input type="date" value={newEntryDate} onChange={(e) => setNewEntryDate(e.target.value)}
                  max={new Date().toISOString().split("T")[0]} min={birthdate}
                  className="h-9 rounded-xl border border-white/10 bg-transparent px-3 text-sm text-white focus:outline-none" />
                <button onClick={handleNewEntry} className="h-9 px-4 rounded-xl bg-pink-500/20 text-pink-300 border border-pink-500/20 text-xs font-medium">Create</button>
                <button onClick={() => setShowNewEntry(false)} className="text-xs text-gray-500">Cancel</button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Search (hidden by default, revealed on 🔍 click) */}
          <AnimatePresence>
            {showSearch && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                <div className="flex gap-2 items-center">
                  <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search entries..."
                    autoFocus className="h-9 flex-1 rounded-xl border border-white/10 bg-transparent px-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-white/10" />
                  <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)}
                    className="h-9 rounded-xl border border-white/10 bg-transparent px-2 text-xs text-white appearance-none cursor-pointer">
                    <option value="all" className="bg-[#0a0a0a]">All Years</option>
                    {yearOptions.map((y) => <option key={y} value={y} className="bg-[#0a0a0a]">Year {y}</option>)}
                  </select>
                  <button onClick={() => setSortOrder(sortOrder === "newest" ? "oldest" : "newest")}
                    className="h-9 px-3 rounded-xl border border-white/10 text-xs text-gray-400 hover:text-white">{sortOrder === "newest" ? "↓" : "↑"}</button>
                  <div className="flex p-0.5 rounded-xl bg-white/5">
                    {(["card", "list"] as ViewMode[]).map((m) => (
                      <button key={m} onClick={() => setViewMode(m)}
                        className={`px-2 py-1 rounded-lg text-xs ${viewMode === m ? "bg-white/10 text-white" : "text-gray-500"}`}>{m === "card" ? "▦" : "☰"}</button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Entries */}
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-500 text-sm">
              {search ? `No entries match "${search}"` : "No entries found"}
            </div>
          ) : viewMode === "card" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filtered.map((e, i) => (
                <motion.div key={e.week_index} className={`${GLASS} p-5 group cursor-pointer`}
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.3) }}
                  onClick={() => openModalForWeek(e.week_index)}>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="text-xs font-semibold text-[#0891b2]">Week {e.col + 1}, Year {e.row}</span>
                      <span className="text-[0.55rem] text-gray-600 ml-2">{e.date}</span>
                    </div>
                    <button onClick={(ev) => { ev.stopPropagation(); confirmDelete === e.week_index ? onSave(e.week_index, "").then(() => setConfirmDelete(null)) : setConfirmDelete(e.week_index); }}
                      className={`w-7 h-7 rounded-lg text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ${confirmDelete === e.week_index ? "bg-red-500/20 text-red-400" : "bg-white/5 text-gray-500"}`}>🗑</button>
                  </div>
                  <p className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap line-clamp-4">{e.content}</p>
                  {e.photos.length > 0 && (
                    <div className="flex gap-1.5 mt-2 overflow-x-auto">
                      {e.photos.map((url, pi) => <img key={pi} src={url} alt="" className="w-14 h-14 rounded-xl object-cover border border-white/10 shrink-0" />)}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {filtered.map((e, i) => (
                <motion.div key={e.week_index} className={`${GLASS} !rounded-2xl px-4 py-3 flex items-center gap-4 group cursor-pointer`}
                  initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(i * 0.02, 0.3) }}
                  onClick={() => openModalForWeek(e.week_index)}>
                  <div className="w-20 shrink-0">
                    <div className="text-xs font-semibold text-[#0891b2]">Wk {e.col + 1}, Yr {e.row}</div>
                    <div className="text-[0.5rem] text-gray-600">{e.date}</div>
                  </div>
                  <p className="flex-1 text-sm text-white/70 truncate">{e.content}</p>
                  {e.photos.length > 0 && <span className="text-[0.55rem] text-gray-600">📷 {e.photos.length}</span>}
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}

      <DiaryModal isOpen={isModalOpen} onClose={closeModal} selectedWeek={selectedWeek}
        initialEntryText={currentEntry} userId={userId} onSave={onSave} />
    </motion.div>
  );
};

export default DiaryPage;
