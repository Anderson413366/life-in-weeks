import React, { useState, useCallback } from "react";
import { addWeeks, differenceInWeeks, format } from "date-fns";
import { useSpeechToText } from "../hooks/useSpeechToText";

interface VoiceJournalButtonProps {
  birthdate: string;
  onSave: (weekIndex: number, content: string) => Promise<void>;
}

const VoiceJournalButton: React.FC<VoiceJournalButtonProps> = ({ birthdate, onSave }) => {
  const [transcript, setTranscript] = useState("");
  const [showPanel, setShowPanel] = useState(false);
  const [saving, setSaving] = useState(false);

  const speech = useSpeechToText(useCallback((text: string) => {
    setTranscript(text);
  }, []));

  if (!speech.isSupported) return null;

  async function handleSave() {
    if (!transcript.trim()) return;
    const birth = new Date(birthdate);
    if (isNaN(birth.getTime())) return;

    setSaving(true);
    const weekIndex = differenceInWeeks(new Date(), birth);
    const weekDate = format(addWeeks(birth, weekIndex), "MMM d, yyyy");
    const entry = `🎙 Voice note — ${weekDate}\n\n${transcript.trim()}`;
    await onSave(weekIndex, entry);
    setTranscript("");
    setShowPanel(false);
    setSaving(false);
  }

  function handleToggle() {
    if (speech.isListening) {
      speech.stop();
    } else if (showPanel) {
      setShowPanel(false);
      setTranscript("");
    } else {
      setShowPanel(true);
      speech.start();
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={handleToggle}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center text-xl shadow-2xl transition-colors
          ${speech.isListening
            ? "bg-accent text-white animate-pulse shadow-accent/40"
            : "bg-primary text-bg-dark shadow-primary/30 hover:bg-primary-dark hover:scale-105 active:scale-95"
          }`}
        title="Voice journal"
      >
        {speech.isListening ? "⏹" : "🎙"}
      </button>

      {/* Transcript panel */}
      {showPanel && (
          <div
            className="fixed bottom-24 right-6 z-50 w-80 max-w-[calc(100vw-3rem)] glass rounded-xl p-4 shadow-2xl border border-box-border animate-fade-in"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm">🎙</span>
                <span className="text-xs font-medium text-white">Voice Journal</span>
              </div>
              {speech.isListening && (
                <span className="text-[0.6rem] text-accent animate-pulse">● Recording</span>
              )}
            </div>

            <div className="min-h-[60px] p-2 rounded-lg bg-[rgba(255,255,255,0.03)] border border-box-border text-sm text-white/80 mb-3">
              {transcript || <span className="text-text-muted/40 italic">Speak now...</span>}
            </div>

            <div className="flex gap-2">
              {!speech.isListening && transcript && (
                <button onClick={() => { setTranscript(""); speech.start(); }}
                  className="flex-1 h-8 rounded-lg border border-box-border text-xs text-text-muted hover:text-white transition-colors">
                  Re-record
                </button>
              )}
              {speech.isListening && (
                <button onClick={speech.stop}
                  className="flex-1 h-8 rounded-lg bg-accent/20 text-accent border border-accent/30 text-xs font-medium">
                  Stop
                </button>
              )}
              {transcript.trim() && !speech.isListening && (
                <button onClick={handleSave} disabled={saving}
                  className="flex-1 h-8 rounded-lg bg-primary hover:bg-primary-dark text-bg-dark text-xs font-semibold transition-colors disabled:opacity-50">
                  {saving ? "Saving..." : "Save Entry"}
                </button>
              )}
            </div>
          </div>
        )}
    </>
  );
};

export default VoiceJournalButton;
