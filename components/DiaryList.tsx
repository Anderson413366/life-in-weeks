import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { addWeeks, format } from "date-fns";
import type { DiaryMap } from "../types";

interface DiaryListProps {
  isOpen: boolean;
  onClose: () => void;
  diaryEntries: DiaryMap;
  birthdate: string;
  onEdit: (weekIndex: number) => void;
  onDelete: (weekIndex: number) => Promise<void>;
}

const DiaryList: React.FC<DiaryListProps> = ({ isOpen, onClose, diaryEntries, birthdate, onEdit, onDelete }) => {
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  const entries = useMemo(() => {
    const birth = new Date(birthdate);
    if (isNaN(birth.getTime())) return [];

    return Object.entries(diaryEntries)
      .map(([key, content]) => {
        const weekIndex = parseInt(key, 10);
        const weekDate = addWeeks(birth, weekIndex);
        const row = Math.floor(weekIndex / 52);
        const col = weekIndex % 52;
        return { weekIndex, content, date: format(weekDate, "MMM d, yyyy"), row, col, dateObj: weekDate };
      })
      .filter((e) => !search || e.content.toLowerCase().includes(search.toLowerCase()) || e.date.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => b.weekIndex - a.weekIndex);
  }, [diaryEntries, birthdate, search]);

  async function handleDelete(weekIndex: number) {
    const key = weekIndex.toString();
    setDeleting(key);
    await onDelete(weekIndex);
    setDeleting(null);
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-start z-[1000] p-3 sm:p-4 pt-8 sm:pt-12 overflow-y-auto"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            className="bg-bg-dark rounded-xl w-full max-w-2xl shadow-2xl border border-box-border flex flex-col max-h-[85vh]"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
          >
            {/* Header */}
            <div className="p-5 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-primary">All Diary Entries</h3>
                <p className="text-xs text-text-muted">{entries.length} {entries.length === 1 ? "entry" : "entries"}</p>
              </div>
              <button onClick={onClose} className="text-text-muted hover:text-white text-lg">✕</button>
            </div>

            {/* Search */}
            <div className="px-5 pb-3">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search entries..."
                className="h-9 w-full rounded-lg border border-box-border bg-transparent px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
              />
            </div>

            {/* Entries */}
            <div className="flex-1 overflow-y-auto px-5 pb-5">
              {entries.length === 0 ? (
                <div className="text-center py-12 text-text-muted/60">
                  {search ? "No entries match your search." : "No diary entries yet. Click a week on the grid to start writing!"}
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {entries.map((e) => (
                    <motion.div
                      key={e.weekIndex}
                      className="glass rounded-lg p-4 group"
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-xs font-semibold text-primary">Week {e.col + 1}, Year {e.row}</span>
                            <span className="text-[0.6rem] text-text-muted">{e.date}</span>
                          </div>
                          <p className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap line-clamp-4">{e.content}</p>
                        </div>
                        <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => { onEdit(e.weekIndex); onClose(); }}
                            className="w-8 h-8 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-xs flex items-center justify-center transition-colors"
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDelete(e.weekIndex)}
                            disabled={deleting === e.weekIndex.toString()}
                            className="w-8 h-8 rounded-lg bg-accent/10 text-accent hover:bg-accent/20 text-xs flex items-center justify-center transition-colors disabled:opacity-50"
                            title="Delete"
                          >
                            🗑
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DiaryList;
