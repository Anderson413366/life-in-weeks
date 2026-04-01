import React, { useState, useEffect, useCallback, useRef } from "react";
import type { SelectedWeek } from "../types";
import { generateReflectionPrompts, analyzeDiaryEntry, hasApiKey } from "../lib/ai";
import { getOnThisDay } from "../lib/onThisDay";
import { uploadPhoto } from "../lib/storage";
import { useSpeechToText } from "../hooks/useSpeechToText";

interface WeekModalProps {
  isOpen: boolean;
  onClose: () => void;
  week: SelectedWeek | null;
  initialEntry: string;
  initialPhotos: string[];
  userId?: string;
  onSave: (weekIndex: number, content: string, photos?: string[]) => Promise<void>;
}

const PROMPTS = [
  { icon: "🏆", label: "Win", prompt: "What was your biggest win this week?" },
  { icon: "🙏", label: "Grateful", prompt: "What are you grateful for this week?" },
  { icon: "💡", label: "Lesson", prompt: "What did you learn this week?" },
  { icon: "❤️", label: "Highlight", prompt: "What was the highlight of your week?" },
];

const WeekModal: React.FC<WeekModalProps> = ({ isOpen, onClose, week, initialEntry, initialPhotos, userId, onSave }) => {
  const [entry, setEntry] = useState(initialEntry);
  const [photos, setPhotos] = useState<string[]>(initialPhotos);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [aiText, setAiText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const speech = useSpeechToText(useCallback((text: string) => {
    setEntry((prev) => prev ? prev + " " + text : text);
  }, []));

  // Derive "on this day" fact
  const onThisDay = React.useMemo(() => {
    if (!week) return null;
    const months: Record<string, number> = { Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12 };
    const parts = week.date.split(" ");
    return getOnThisDay(months[parts[0]] ?? 1, parseInt(parts[1], 10) || 1);
  }, [week]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setEntry(initialEntry);
      setPhotos(initialPhotos);
      setPendingFiles([]);
      setAiText("");
    }
  }, [isOpen, initialEntry, initialPhotos]);

  // Escape to close
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  if (!week) return null;

  const age = week.row;
  const weekNum = week.col + 1;
  const hasContent = entry.trim().length > 0;

  async function handleAi() {
    setAiLoading(true);
    try {
      const result = hasContent ? await analyzeDiaryEntry(entry) : await generateReflectionPrompts(week!.date);
      setAiText(result);
    } catch { setAiText("AI unavailable"); }
    finally { setAiLoading(false); }
  }

  async function handleSave() {
    if (!week) return;
    setSaving(true);
    try {
      let allPhotos = [...photos];
      if (userId && pendingFiles.length > 0) {
        setUploading(true);
        try {
          for (const f of pendingFiles) {
            allPhotos.push(await uploadPhoto(userId, f));
          }
        } finally {
          setUploading(false);
        }
      }
      await onSave(week.index, entry, allPhotos);
      onClose();
    } catch (err) {
      console.error("Save error:", err);
    } finally { setSaving(false); }
  }

  function insertPrompt(text: string) {
    setEntry((prev) => prev ? prev + "\n\n" + text + "\n" : text + "\n");
  }

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center p-4"
          style={{ animation: "fadeIn 0.2s ease-out forwards" }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Modal card */}
          <div
            className="relative w-full max-w-lg bg-[#0a0a0a] border border-white/10 rounded-3xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden"
            style={{ animation: "fadeIn 0.2s ease-out forwards" }}
            role="dialog"
            aria-modal="true"
          >
            {/* ── Header ─────────────────────────────────────── */}
            <div className="flex items-center justify-between px-6 pt-5 pb-3">
              <div>
                <h2 className="text-lg font-semibold text-white tracking-tight">
                  Week {weekNum} <span className="text-white/30 mx-1">•</span> Age {age}
                </h2>
                <p className="text-xs text-white/40 mt-0.5">{week.date}</p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            {/* ── On this day ─────────────────────────────────── */}
            {onThisDay && (
              <div className="mx-6 mb-3 px-4 py-2.5 rounded-2xl bg-amber-500/5 border border-amber-500/10">
                {onThisDay.fact && (
                  <p className="text-xs text-amber-300/80">
                    <span className="font-semibold">{onThisDay.fact.year}:</span> {onThisDay.fact.text}
                  </p>
                )}
                <p className="text-[0.6rem] text-white/30 mt-1 italic">💡 {onThisDay.funFact}</p>
              </div>
            )}

            {/* ── Content (scrollable) ────────────────────────── */}
            <div className="flex-1 overflow-y-auto px-6 pb-4">

              {/* Voice button — hero CTA when no entry */}
              {!hasContent && !speech.isListening && (
                <div className="flex flex-col items-center py-6">
                  <button
                    onClick={speech.isSupported ? speech.start : undefined}
                    className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-500/20 to-cyan-500/20 border border-pink-500/20 flex items-center justify-center text-3xl shadow-lg animate-pulse-slow transition-transform duration-200 hover:scale-105"
                    title="Hold to brain dump"
                  >
                    🎙
                  </button>
                  <p className="text-xs text-white/30 mt-3 tracking-wider">TAP TO BRAIN DUMP</p>
                </div>
              )}

              {/* Recording state */}
              {speech.isListening && (
                <div className="flex flex-col items-center py-6">
                  <button
                    onClick={speech.stop}
                    className="w-20 h-20 rounded-full bg-[#ec4899]/20 border-2 border-[#ec4899] flex items-center justify-center text-3xl shadow-lg shadow-[#ec4899]/30 animate-pulse-slow"
                  >
                    ⏹
                  </button>
                  <p className="text-xs text-[#ec4899] mt-3 animate-pulse tracking-wider">LISTENING...</p>
                </div>
              )}

              {/* Quick prompts */}
              {!hasContent && !speech.isListening && (
                <div className="flex flex-wrap justify-center gap-2 mb-4">
                  {PROMPTS.map((p) => (
                    <button
                      key={p.label}
                      onClick={() => insertPrompt(p.prompt)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs bg-white/5 border border-white/8 text-white/50 hover:text-white hover:border-white/15 transition-all"
                    >
                      {p.icon} {p.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Text area */}
              <div className="relative">
                <textarea
                  value={entry}
                  onChange={(e) => setEntry(e.target.value)}
                  placeholder={hasContent ? "" : "Write about this week..."}
                  className="w-full min-h-[120px] max-h-[240px] p-4 rounded-2xl bg-white/[0.03] border border-white/8 text-white text-sm leading-relaxed resize-y placeholder:text-white/20 focus:outline-none focus:border-[#0891b2]/50 focus:ring-1 focus:ring-[#0891b2]/30 transition-all"
                  autoFocus={hasContent}
                />
                {speech.isSupported && hasContent && !speech.isListening && (
                  <button
                    onClick={speech.start}
                    className="absolute right-3 top-3 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-sm transition-colors"
                    title="Voice input"
                  >
                    🎙
                  </button>
                )}
              </div>

              {/* Photos */}
              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs bg-white/5 border border-white/8 text-white/40 hover:text-white hover:border-white/15 transition-all"
                >
                  📷 Photos
                </button>
                <input ref={fileRef} type="file" accept="image/*" multiple capture="environment" className="hidden"
                  onChange={(e) => { setPendingFiles((prev) => [...prev, ...Array.from(e.target.files ?? [])]); if (fileRef.current) fileRef.current.value = ""; }} />
                {(photos.length + pendingFiles.length) > 0 && (
                  <span className="text-[0.6rem] text-white/25">{photos.length + pendingFiles.length} photo{photos.length + pendingFiles.length !== 1 ? "s" : ""}</span>
                )}
              </div>
              {(photos.length > 0 || pendingFiles.length > 0) && (
                <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
                  {photos.map((url, i) => (
                    <div key={`e-${i}`} className="relative shrink-0 group">
                      <img src={url} alt="" className="w-16 h-16 rounded-xl object-cover border border-white/10" />
                      <button onClick={() => setPhotos((p) => p.filter((_, j) => j !== i))}
                        className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[0.5rem] flex items-center justify-center opacity-0 group-hover:opacity-100">✕</button>
                    </div>
                  ))}
                  {pendingFiles.map((f, i) => (
                    <div key={`p-${i}`} className="relative shrink-0 group">
                      <img src={URL.createObjectURL(f)} alt="" className="w-16 h-16 rounded-xl object-cover border border-cyan-500/30" />
                      <button onClick={() => setPendingFiles((p) => p.filter((_, j) => j !== i))}
                        className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[0.5rem] flex items-center justify-center opacity-0 group-hover:opacity-100">✕</button>
                    </div>
                  ))}
                </div>
              )}

              {/* AI Section */}
              {aiText && (
                <div className="mt-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                  <p className="text-[0.6rem] text-white/25 uppercase tracking-widest mb-2">AI Insight</p>
                  <p className="text-sm text-white/60 leading-relaxed whitespace-pre-wrap">{aiText}</p>
                </div>
              )}
              {!aiText && !hasContent && (
                <div className="mt-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-center">
                  <p className="text-sm text-white/20 italic">No entry for this week</p>
                  <p className="text-[0.6rem] text-white/10 mt-1">Tap the mic or a prompt to start</p>
                </div>
              )}
            </div>

            {/* ── Footer ─────────────────────────────────────── */}
            <div className="px-6 py-4 border-t border-white/5 flex items-center gap-2">
              {hasApiKey() && (
                <button
                  onClick={handleAi}
                  disabled={aiLoading}
                  className="h-10 px-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-medium hover:bg-purple-500/20 transition-colors disabled:opacity-40 flex items-center gap-1.5"
                >
                  ✨ {aiLoading ? "Thinking..." : hasContent ? "Analyze" : "Prompts"}
                </button>
              )}
              <div className="flex-1" />
              <button
                onClick={onClose}
                className="h-10 px-4 rounded-2xl bg-white/5 text-white/40 text-xs hover:text-white hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || uploading}
                className="h-10 px-6 rounded-2xl bg-[#0891b2] hover:bg-[#0891b2]/80 text-white text-xs font-semibold transition-colors disabled:opacity-50"
              >
                {saving || uploading ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default WeekModal;
