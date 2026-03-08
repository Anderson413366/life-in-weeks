import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { SelectedWeek } from "../types";
import { generateReflectionPrompts, analyzeDiaryEntry, hasApiKey } from "../lib/ai";
import { getOnThisDay } from "../lib/onThisDay";
import { useSpeechToText } from "../hooks/useSpeechToText";

interface DiaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedWeek: SelectedWeek | null;
  initialEntryText: string;
  onSave: (weekIndex: number, content: string) => Promise<void>;
}

const PROMPTS = [
  { icon: "🏆", label: "Win of the week", prompt: "What was your biggest win this week?" },
  { icon: "🙏", label: "Gratitude", prompt: "What are you grateful for this week?" },
  { icon: "💡", label: "Lesson learned", prompt: "What did you learn this week?" },
  { icon: "🎯", label: "Goal progress", prompt: "How did you progress toward your goals?" },
  { icon: "❤️", label: "Highlight", prompt: "What was the highlight of your week?" },
];

const DiaryModal: React.FC<DiaryModalProps> = ({ isOpen, onClose, selectedWeek, initialEntryText, onSave }) => {
  const [entryText, setEntryText] = useState(initialEntryText);
  const [aiResponse, setAiResponse] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [activeTab, setActiveTab] = useState<"write" | "ai">("write");

  const speech = useSpeechToText(useCallback((text: string) => {
    setEntryText((prev) => prev ? prev + " " + text : text);
  }, []));

  const onThisDay = useMemo(() => {
    if (!selectedWeek) return null;
    const parts = selectedWeek.date.split(" ");
    const monthNames: Record<string, number> = { Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12 };
    const month = monthNames[parts[0]] ?? 1;
    const day = parseInt(parts[1], 10) || 1;
    return getOnThisDay(month, day);
  }, [selectedWeek]);

  useEffect(() => {
    if (isOpen) {
      setEntryText(initialEntryText);
      setAiResponse("");
      setAiError("");
      setActiveTab("write");
    }
  }, [isOpen, initialEntryText]);

  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, handleEscape]);

  if (!selectedWeek) return null;

  async function handleAiAction() {
    setAiLoading(true);
    setAiResponse("");
    setAiError("");
    try {
      const result = entryText.trim() === ""
        ? await generateReflectionPrompts(selectedWeek!.date)
        : await analyzeDiaryEntry(entryText);
      setAiResponse(result);
      setActiveTab("ai");
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "AI error");
    } finally {
      setAiLoading(false);
    }
  }

  async function handleSave() {
    await onSave(selectedWeek!.index, entryText);
    onClose();
  }

  function insertPrompt(prompt: string) {
    setEntryText((prev) => prev ? prev + "\n\n" + prompt + "\n" : prompt + "\n");
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-[1000] p-3 sm:p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
          role="dialog" aria-modal="true"
        >
          <motion.div
            className="bg-bg-dark rounded-xl w-full max-w-xl shadow-2xl border border-box-border max-h-[92vh] flex flex-col overflow-hidden"
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.2 } }}
            exit={{ opacity: 0, y: 30, scale: 0.95, transition: { duration: 0.15 } }}
          >
            {/* Header */}
            <div className="p-4 sm:p-5 pb-0">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-lg font-semibold text-primary">
                  Week {selectedWeek.col + 1}, Year {selectedWeek.row}
                </h3>
                <button onClick={onClose} className="text-text-muted hover:text-white text-lg transition-colors">✕</button>
              </div>
              <p className="text-xs text-text-muted">{selectedWeek.date}</p>

              {/* On this day */}
              {onThisDay && (
                <div className="mt-3 p-3 rounded-lg bg-[rgba(255,215,0,0.05)] border border-[#ffd700]/15">
                  {onThisDay.fact && (
                    <div className="text-xs text-[#ffd700]/90 mb-1">
                      <span className="font-semibold">On this day in {onThisDay.fact.year}:</span> {onThisDay.fact.text}
                    </div>
                  )}
                  <div className="text-[0.65rem] text-text-muted/60 italic">💡 {onThisDay.funFact}</div>
                </div>
              )}

              {/* Tabs */}
              <div className="flex gap-1 mt-3 p-0.5 bg-[rgba(255,255,255,0.03)] rounded-lg">
                {(["write", "ai"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors
                      ${activeTab === tab ? "bg-primary/15 text-primary" : "text-text-muted hover:text-white"}`}
                  >
                    {tab === "write" ? "Write" : "AI Insights"}
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 pt-3">
              {activeTab === "write" ? (
                <>
                  {/* Quick prompts */}
                  {!entryText.trim() && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {PROMPTS.map((p) => (
                        <button
                          key={p.label}
                          onClick={() => insertPrompt(p.prompt)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[0.65rem] glass border border-box-border/50 text-text-muted hover:text-white hover:border-primary/30 transition-all"
                        >
                          <span>{p.icon}</span> {p.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Text area with voice button */}
                  <div className="relative">
                    <textarea
                      className="w-full min-h-[160px] max-h-[300px] p-3 pr-12 bg-[rgba(255,255,255,0.03)] border border-box-border rounded-lg text-white resize-y text-sm leading-relaxed focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      value={entryText}
                      onChange={(e) => setEntryText(e.target.value)}
                      placeholder="Start writing about your week... or tap a prompt above to get started."
                      autoFocus
                    />
                    {/* Voice button */}
                    {speech.isSupported && (
                      <button
                        onClick={speech.isListening ? speech.stop : speech.start}
                        className={`absolute right-2 top-2 w-9 h-9 rounded-full flex items-center justify-center transition-all
                          ${speech.isListening
                            ? "bg-accent text-white animate-pulse shadow-lg shadow-accent/40"
                            : "bg-[rgba(255,255,255,0.05)] text-text-muted hover:text-white hover:bg-[rgba(255,255,255,0.1)]"
                          }`}
                        title={speech.isListening ? "Stop recording" : "Voice input"}
                      >
                        {speech.isListening ? "⏹" : "🎙"}
                      </button>
                    )}
                  </div>
                  {speech.isListening && (
                    <div className="text-xs text-accent mt-1 animate-pulse">Listening... speak now</div>
                  )}
                </>
              ) : (
                /* AI tab */
                <div className="min-h-[160px]">
                  {aiLoading && (
                    <div className="flex items-center justify-center text-primary text-sm py-8">
                      <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Thinking...
                    </div>
                  )}
                  {aiError && <div className="text-accent text-sm p-3">{aiError}</div>}
                  {aiResponse && !aiLoading && (
                    <div
                      className="text-sm text-text-muted whitespace-pre-wrap leading-relaxed"
                      dangerouslySetInnerHTML={{
                        __html: aiResponse
                          .replace(/\n/g, "<br/>")
                          .replace(/\*\*(.*?)\*\*/g, "<strong class='text-primary'>$1</strong>")
                          .replace(/\*(.*?)\*/g, "<em>$1</em>"),
                      }}
                    />
                  )}
                  {!aiLoading && !aiResponse && !aiError && (
                    <div className="text-center py-8">
                      <p className="text-sm text-text-muted/70">
                        {hasApiKey()
                          ? entryText.trim() ? "Get AI analysis of your entry" : "Get AI-powered reflection prompts"
                          : "Add your Gemini API key in Settings to enable AI"}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 sm:p-5 pt-3 border-t border-box-border/30 flex flex-col-reverse sm:flex-row sm:justify-between items-center gap-2">
              <button
                onClick={handleAiAction}
                disabled={aiLoading || !hasApiKey()}
                className="w-full sm:w-auto bg-gemini-button-bg hover:bg-gemini-button-hover-bg text-white py-2 px-4 rounded-lg text-xs font-medium transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
              >
                ✨ {entryText.trim() ? "Analyze" : "Get Prompts"}
              </button>
              <div className="flex gap-2 w-full sm:w-auto">
                <button onClick={onClose} className="flex-1 sm:flex-initial py-2 px-4 rounded-lg bg-[rgba(255,255,255,0.06)] text-text-muted hover:text-white text-xs font-medium transition-colors">
                  Cancel
                </button>
                <button onClick={handleSave} className="flex-1 sm:flex-initial py-2 px-5 rounded-lg bg-primary hover:bg-primary-dark text-bg-dark text-xs font-semibold transition-colors">
                  Save
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DiaryModal;
