import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { SelectedWeek } from "../types";
import { generateReflectionPrompts, analyzeDiaryEntry, hasApiKey } from "../lib/ai";

interface DiaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedWeek: SelectedWeek | null;
  initialEntryText: string;
  onSave: (weekIndex: number, content: string) => Promise<void>;
}

const DiaryModal: React.FC<DiaryModalProps> = ({ isOpen, onClose, selectedWeek, initialEntryText, onSave }) => {
  const [entryText, setEntryText] = useState(initialEntryText);
  const [aiResponse, setAiResponse] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setEntryText(initialEntryText);
      setAiResponse("");
      setAiError("");
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

  const aiButtonLabel = entryText.trim() === "" ? "Get Reflection Prompts" : "Analyze My Entry";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-[1000] p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="diary-title"
        >
          <motion.div
            className="bg-bg-dark rounded-lg w-full max-w-lg p-5 sm:p-7 shadow-2xl border border-box-border max-h-[90vh] flex flex-col overflow-y-auto"
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.2 } }}
            exit={{ opacity: 0, y: 30, scale: 0.95, transition: { duration: 0.15 } }}
          >
            <div className="text-center mb-5">
              <h3 id="diary-title" className="text-lg sm:text-xl font-semibold text-primary mb-1">
                Diary: Week {selectedWeek.col + 1}, Year {selectedWeek.row}
              </h3>
              <p className="text-sm text-text-muted">{selectedWeek.date}</p>
            </div>

            <textarea
              className="w-full min-h-[120px] max-h-[250px] p-3 bg-[rgba(255,255,255,0.03)] border border-box-border rounded-md text-text-main resize-y mb-5 text-base leading-relaxed focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              value={entryText}
              onChange={(e) => setEntryText(e.target.value)}
              placeholder="What happened this week? Reflections, events, feelings..."
              autoFocus
            />

            {/* AI section */}
            <div className="mb-5 p-3 bg-[rgba(255,255,255,0.05)] border border-box-border rounded-md min-h-[70px] text-left">
              {aiLoading && (
                <div className="flex items-center justify-center text-primary text-sm py-2">
                  <svg className="animate-spin h-4 w-4 mr-2 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Generating insights...
                </div>
              )}
              {aiError && <div className="text-accent text-sm p-2">{aiError}</div>}
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
                <p className="text-xs text-text-muted/70 text-center py-2">
                  {hasApiKey()
                    ? entryText.trim() === "" ? "Click 'Get Reflection Prompts' for ideas." : "Click 'Analyze My Entry' for an AI summary."
                    : "Add your Gemini API key in settings to enable AI features."}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="mt-auto flex flex-col-reverse sm:flex-row sm:justify-between items-center gap-3 pt-1">
              <button
                onClick={handleAiAction}
                disabled={aiLoading || !hasApiKey()}
                className="w-full sm:w-auto bg-gemini-button-bg hover:bg-gemini-button-hover-bg text-white py-2.5 px-4 rounded-md text-sm font-medium transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md"
              >
                <span className="text-lg">✨</span>
                {aiButtonLabel}
              </button>
              <div className="flex gap-3 w-full sm:w-auto">
                <button
                  onClick={onClose}
                  className="w-full sm:w-auto bg-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.15)] text-text-muted hover:text-text-main py-2.5 px-5 rounded-md text-sm font-medium transition-colors shadow"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="w-full sm:w-auto bg-primary hover:bg-primary-dark text-bg-dark py-2.5 px-5 rounded-md text-sm font-semibold transition-colors shadow-md"
                >
                  Save Entry
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
