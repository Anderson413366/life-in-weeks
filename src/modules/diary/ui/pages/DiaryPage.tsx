import React, { Suspense, lazy, useState, useMemo, useCallback } from "react";
import { addWeeks, differenceInWeeks, format } from "date-fns";
import type { AppMode } from "@/modules/preferences";
import { Button, InfoCard, QuoteBlock, SegmentedControl, SelectField, Surface, TextField } from "@/shared/ui/components";
import { formatLocalDate, parseStoredDate } from "@/shared/lib";

import type { DiaryEntry, DiaryMap, SelectedWeek } from "../../types/diary.types";

const DiaryModal = lazy(() => import("../components/DiaryModal"));

interface DiaryPageProps {
  fullEntries: DiaryEntry[];
  diaryEntries: DiaryMap;
  birthdate: string;
  userId?: string;
  mode: AppMode;
  onSave: (weekIndex: number, content: string, photos?: string[]) => Promise<void>;
}

type ViewMode = "card" | "list";
type SortOrder = "newest" | "oldest";

const SURFACE = "app-surface app-surface--panel";

const DiaryPage: React.FC<DiaryPageProps> = ({ fullEntries, diaryEntries, birthdate, userId, mode, onSave }) => {
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("card");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [selectedWeek, setSelectedWeek] = useState<SelectedWeek | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [newEntryDate, setNewEntryDate] = useState(() => formatLocalDate());

  const birth = useMemo(() => parseStoredDate(birthdate), [birthdate]);
  const hasEntries = fullEntries.length > 0;

  const yearOptions = useMemo(() => {
    const years = new Set(fullEntries.map((e) => Math.floor(e.week_index / 52)));
    return Array.from(years).sort((a, b) => b - a);
  }, [fullEntries]);

  const filtered = useMemo(() => {
    if (!birth) return [];
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
    if (!birth) return;
    const row = Math.floor(weekIndex / 52);
    const col = weekIndex % 52;
    setSelectedWeek({ index: weekIndex, row, col, date: format(addWeeks(birth, weekIndex), "MMM d, yyyy") });
    setIsModalOpen(true);
  }, [birth]);

  function handleNewEntry() {
    const date = parseStoredDate(newEntryDate);
    if (!date || !birth) return;
    openModalForWeek(Math.max(0, differenceInWeeks(date, birth)));
    setShowNewEntry(false);
  }

  function openCurrentWeek() {
    if (!birth) return;
    openModalForWeek(differenceInWeeks(new Date(), birth));
  }

  const closeModal = useCallback(() => { setIsModalOpen(false); setSelectedWeek(null); }, []);
  const currentEntry = selectedWeek ? diaryEntries[selectedWeek.index.toString()] ?? "" : "";
  const currentPhotos = selectedWeek ? fullEntries.find((entry) => entry.week_index === selectedWeek.index)?.photos ?? [] : [];
  const modalFallback = <div className="text-xs text-white/40 text-center py-4">Loading editor...</div>;
  const isFocus = mode === "focus";

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto animate-fade-in">
      <Surface variant="hero">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <p className={`text-[0.7rem] uppercase tracking-[0.22em] ${isFocus ? "text-white/55" : "text-primary"}`}>Journal Flow</p>
              <h2 className="text-2xl font-semibold text-white">A clean record of the weeks that mattered.</h2>
              <p className="max-w-2xl text-sm leading-7 text-white/65">
                Capture the current week fast, then search or filter the archive without hiding the controls behind extra clicks.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="chip">
                <span className="text-[0.62rem] uppercase tracking-[0.18em] text-white/45">Entries</span>
                <span className="text-sm text-white">{fullEntries.length}</span>
              </div>
              <Button onClick={openCurrentWeek} variant="primary">
                Capture This Week
              </Button>
              <Button onClick={() => setShowNewEntry((prev) => !prev)}>
                {showNewEntry ? "Close Date Picker" : "Write Another Week"}
              </Button>
            </div>
          </div>

          {showNewEntry && (
            <Surface variant="inset" className="p-4 flex flex-col gap-3 sm:flex-row sm:items-center">
              <TextField
                type="date"
                value={newEntryDate}
                onChange={(e) => setNewEntryDate(e.target.value)}
                max={formatLocalDate()}
                min={birthdate}
              />
              <Button onClick={handleNewEntry} size="sm" variant="primary">
                Open Week
              </Button>
              <Button onClick={() => setShowNewEntry(false)} size="sm" variant="quiet">
                Cancel
              </Button>
            </Surface>
          )}

          {hasEntries && (
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto_auto]">
              <TextField
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by text or date..."
                aria-label="Search journal entries"
              />
              <SelectField
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                aria-label="Filter journal entries by year"
              >
                <option value="all" className="bg-[#0a0a0a]">All Years</option>
                {yearOptions.map((y) => <option key={y} value={y} className="bg-[#0a0a0a]">Year {y}</option>)}
              </SelectField>
              <Button
                onClick={() => setSortOrder(sortOrder === "newest" ? "oldest" : "newest")}
                aria-label={`Sort journal entries ${sortOrder === "newest" ? "oldest first" : "newest first"}`}
              >
                {sortOrder === "newest" ? "Newest first" : "Oldest first"}
              </Button>
              <SegmentedControl
                value={viewMode}
                onChange={setViewMode}
                label="Diary view"
                items={[
                  { value: "card", label: "Cards" },
                  { value: "list", label: "List" },
                ]}
              />
            </div>
          )}
        </div>
      </Surface>

      {hasEntries ? (
        <div className="grid gap-3 md:grid-cols-3">
          <InfoCard title="Current archive" description={`${fullEntries.length} saved week${fullEntries.length === 1 ? "" : "s"} in your private record.`} tone="accent" />
          <InfoCard title="Filtered view" description={`${filtered.length} entr${filtered.length === 1 ? "y" : "ies"} visible with the current search and year filter.`} />
          <InfoCard title="Fast path" description="Use Capture This Week for the present, and Write Another Week only for backfill." />
        </div>
      ) : null}

      {!hasEntries ? (
        <div className={`${SURFACE} flex flex-col gap-5 p-6 text-left sm:p-8`}>
          <div className="space-y-2">
            <p className={`text-[0.7rem] uppercase tracking-[0.22em] ${isFocus ? "text-white/55" : "text-primary"}`}>Start here</p>
            <h3 className="text-2xl font-semibold text-white">Your diary starts with one honest week.</h3>
            <p className="max-w-2xl text-sm leading-7 text-white/68">
              Save the current week first if you want the fastest path. Choose another date only when you are backfilling or correcting older history.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button onClick={openCurrentWeek} aria-label="Capture the current week" variant="primary">
              Capture this week
            </Button>
            <Button onClick={() => setShowNewEntry((prev) => !prev)}>
              {showNewEntry ? "Close date picker" : "Choose another week"}
            </Button>
          </div>

          {showNewEntry && (
            <Surface variant="inset" className="p-4 flex flex-col gap-3 sm:flex-row sm:items-center animate-fade-in">
              <TextField
                type="date"
                value={newEntryDate}
                onChange={(e) => setNewEntryDate(e.target.value)}
                max={formatLocalDate()}
                min={birthdate}
              />
              <Button onClick={handleNewEntry} size="sm" variant="primary">
                Open week
              </Button>
              <Button onClick={() => setShowNewEntry(false)} size="sm" variant="quiet">
                Cancel
              </Button>
            </Surface>
          )}
        </div>
      ) : (
        <>
          {filtered.length === 0 ? (
            <div className={`${SURFACE} text-center py-12 text-gray-500 text-sm`}>
              {search ? `No entries match "${search}"` : "No entries found"}
            </div>
          ) : viewMode === "card" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filtered.map((e) => (
                <article key={e.week_index} className={`${SURFACE} p-5 group animate-fade-in`}>
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => openModalForWeek(e.week_index)}
                      aria-label={`Open journal entry for week ${e.col + 1}, year ${e.row}, dated ${e.date}`}
                      className="min-w-0 flex-1 text-left"
                    >
                      <span className={`text-xs font-semibold ${isFocus ? "text-white/80" : "text-[#0891b2]"}`}>Week {e.col + 1}, Year {e.row}</span>
                      <span className="ml-2 text-[0.55rem] text-gray-600">{e.date}</span>
                    </button>
                    <button
                      type="button"
                      onClick={(ev) => { ev.stopPropagation(); confirmDelete === e.week_index ? onSave(e.week_index, "").then(() => setConfirmDelete(null)) : setConfirmDelete(e.week_index); }}
                      aria-label={confirmDelete === e.week_index ? "Confirm delete journal entry" : "Delete journal entry"}
                      className={`rounded-lg px-2 text-[0.65rem] font-semibold opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 ${confirmDelete === e.week_index ? "bg-red-500/20 text-red-300" : "bg-white/5 text-gray-400"}`}
                    >
                      Del
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => openModalForWeek(e.week_index)}
                    aria-label={`Read journal entry for week ${e.col + 1}, year ${e.row}`}
                    className="block w-full text-left"
                  >
                    <p className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap line-clamp-4">{e.content}</p>
                    {((e.photos || []).length) > 0 && (
                      <div className="mt-2 flex gap-1.5 overflow-x-auto">
                        {((e.photos || []).map)((url, pi) => <img key={pi} src={url} alt="" className="h-14 w-14 shrink-0 rounded-xl border border-white/10 object-cover" />)}
                      </div>
                    )}
                  </button>
                </article>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {filtered.map((e) => (
                <button
                  key={e.week_index}
                  type="button"
                  onClick={() => openModalForWeek(e.week_index)}
                  aria-label={`Open journal entry for week ${e.col + 1}, year ${e.row}, dated ${e.date}`}
                  className={`${SURFACE} !rounded-2xl flex items-center gap-4 px-4 py-3 text-left animate-fade-in`}
                >
                  <div className="w-20 shrink-0">
                    <div className={`text-xs font-semibold ${isFocus ? "text-white/80" : "text-[#0891b2]"}`}>Wk {e.col + 1}, Yr {e.row}</div>
                    <div className="text-[0.5rem] text-gray-600">{e.date}</div>
                  </div>
                  <p className="flex-1 text-sm text-white/70 truncate">{e.content}</p>
                  {((e.photos || []).length) > 0 && <span className="text-[0.55rem] text-gray-600">{((e.photos || []).length)} photos</span>}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      <div className="pt-4 pb-6"><QuoteBlock /></div>

      {isModalOpen && (
        <Suspense fallback={modalFallback}>
          <DiaryModal isOpen={isModalOpen} onClose={closeModal} selectedWeek={selectedWeek}
            initialEntryText={currentEntry} initialPhotos={currentPhotos} userId={userId} onSave={onSave} />
        </Suspense>
      )}
    </div>
  );
};

export default DiaryPage;
