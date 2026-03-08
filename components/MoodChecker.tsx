import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { MoodEntry } from "../hooks/useMood";

interface MoodCheckerProps {
  todayMood: MoodEntry | null;
  recentMoods: MoodEntry[];
  onSave: (mood: string, energy: number, note?: string) => Promise<void>;
}

const MOODS = [
  { emoji: "😄", label: "Great",    color: "#4caf50" },
  { emoji: "🙂", label: "Good",     color: "#00d4ff" },
  { emoji: "😐", label: "Okay",     color: "#ffd700" },
  { emoji: "😔", label: "Low",      color: "#ff9f43" },
  { emoji: "😢", label: "Rough",    color: "#ff6b6b" },
];

const ENERGY_LABELS = ["Drained", "Low", "Moderate", "Energized", "Supercharged"];

const MoodChecker: React.FC<MoodCheckerProps> = ({ todayMood, recentMoods, onSave }) => {
  const [selectedMood, setSelectedMood] = useState<string | null>(todayMood?.mood ?? null);
  const [energy, setEnergy] = useState(todayMood?.energy ?? 3);
  const [note, setNote] = useState(todayMood?.note ?? "");
  const [expanded, setExpanded] = useState(!todayMood);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!selectedMood) return;
    setSaving(true);
    await onSave(selectedMood, energy, note);
    setSaving(false);
    setExpanded(false);
  }

  const moodColor = MOODS.find((m) => m.emoji === (todayMood?.mood ?? selectedMood))?.color ?? "#b4b4c7";

  return (
    <div className="glass rounded-xl p-5 sm:p-6 max-w-lg mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">🧠</span>
          <div>
            <h3 className="text-sm font-semibold text-white">How are you feeling right now?</h3>
            <p className="text-[0.55rem] text-text-muted/50">Resets every 3 hours for a fresh check-in</p>
          </div>
        </div>
        {todayMood && !expanded && (
          <button onClick={() => setExpanded(true)} className="text-xs text-primary hover:underline">Update</button>
        )}
      </div>

      {/* Today's mood display (when already logged) */}
      {todayMood && !expanded && (
        <motion.div
          className="flex items-center gap-3 p-3 rounded-lg"
          style={{ backgroundColor: `${moodColor}10`, borderLeft: `3px solid ${moodColor}` }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <span className="text-3xl">{todayMood.mood}</span>
          <div>
            <div className="text-sm text-white font-medium">
              {MOODS.find((m) => m.emoji === todayMood.mood)?.label} — Energy: {ENERGY_LABELS[(todayMood.energy ?? 3) - 1]}
            </div>
            {todayMood.note && <div className="text-xs text-text-muted mt-0.5">{todayMood.note}</div>}
          </div>
        </motion.div>
      )}

      {/* Mood picker */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-col gap-4"
          >
            {/* Emoji selector */}
            <div className="flex justify-center gap-3">
              {MOODS.map((m) => (
                <button
                  key={m.emoji}
                  onClick={() => setSelectedMood(m.emoji)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                    selectedMood === m.emoji
                      ? "scale-110 ring-2 ring-offset-2 ring-offset-bg-dark"
                      : "opacity-50 hover:opacity-80"
                  }`}
                  style={selectedMood === m.emoji ? { boxShadow: `0 0 0 2px ${m.color}` } : {}}
                >
                  <span className="text-3xl sm:text-4xl">{m.emoji}</span>
                  <span className="text-[0.55rem] text-text-muted">{m.label}</span>
                </button>
              ))}
            </div>

            {/* Energy slider */}
            {selectedMood && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-2">
                <div className="flex justify-between text-xs text-text-muted">
                  <span>Energy Level</span>
                  <span className="text-white font-medium">{ENERGY_LABELS[energy - 1]}</span>
                </div>
                <input
                  type="range"
                  min={1} max={5} step={1}
                  value={energy}
                  onChange={(e) => setEnergy(parseInt(e.target.value, 10))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, ${moodColor} ${(energy - 1) * 25}%, rgba(255,255,255,0.1) ${(energy - 1) * 25}%)`,
                  }}
                />
                <div className="flex justify-between text-[0.5rem] text-text-muted/50">
                  {ENERGY_LABELS.map((l) => <span key={l}>{l}</span>)}
                </div>
              </motion.div>
            )}

            {/* Note */}
            {selectedMood && (
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Quick note about how you're feeling... (optional)"
                className="h-10 rounded-lg border border-box-border bg-transparent px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
              />
            )}

            {/* Save */}
            {selectedMood && (
              <button
                onClick={handleSave}
                disabled={saving}
                className="h-10 rounded-lg bg-primary/20 text-primary border border-primary/30 text-sm font-medium hover:bg-primary/30 transition-colors disabled:opacity-50"
              >
                {saving ? "Saving..." : todayMood ? "Update Mood" : "Log Mood"}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mood streak (last 7 days) */}
      {recentMoods.length > 1 && (
        <div className="mt-4 pt-3 border-t border-box-border/30">
          <div className="text-[0.6rem] text-text-muted/60 mb-2 uppercase tracking-wider">Recent Mood</div>
          <div className="flex gap-1.5 justify-center">
            {recentMoods.slice(0, 7).map((m) => (
              <div key={m.date} className="flex flex-col items-center gap-0.5" title={`${m.date}: ${MOODS.find((x) => x.emoji === m.mood)?.label}`}>
                <span className="text-lg">{m.mood}</span>
                <span className="text-[0.45rem] text-text-muted/40">{new Date(m.date + "T12:00:00").toLocaleDateString("en", { weekday: "narrow" })}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MoodChecker;
