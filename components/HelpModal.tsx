import React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ITEMS = [
  { emoji: "📊", label: "Dashboard", desc: "Your life stats at a glance. Tap any section to expand." },
  { emoji: "⬛", label: "Life Grid", desc: "Zoom & pan your entire life in Weeks, Months, or Years. Tap any cell to journal." },
  { emoji: "📖", label: "Diary", desc: "Tap the mic button to voice-journal. Each entry lights up your grid." },
  { emoji: "⚙️", label: "Settings", desc: "Set your birthdate, life expectancy, and AI key for horoscope + insights." },
  { emoji: "🎙️", label: "Voice Journal", desc: "Hold the mic on any screen to capture a moment in under 10 seconds." },
  { emoji: "🪞", label: "Time Mirror", desc: "Upload your photo and AI generates your portrait at every decade of your life." },
  { emoji: "✨", label: "Horoscope", desc: "Requires a Gemini API key (free at aistudio.google.com) added in Settings." },
];

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        className="fixed inset-0 z-[1001] flex items-center justify-center bg-black/70 backdrop-blur-md"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-[#0d1b2e] border border-[#1e3a5f] rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9 }}
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-white text-2xl font-bold mb-1">LifeForge Guide</h2>
          <p className="text-[#4a9eff] text-sm mb-6">Your life, visualized.</p>

          <ul className="space-y-4">
            {ITEMS.map((item) => (
              <li key={item.label} className="flex items-start gap-3">
                <span className="text-xl mt-0.5 shrink-0">{item.emoji}</span>
                <div>
                  <span className="text-white font-semibold text-sm">{item.label}</span>
                  <span className="text-white/50 text-sm"> — {item.desc}</span>
                </div>
              </li>
            ))}
          </ul>

          <button
            onClick={onClose}
            className="mt-6 w-full bg-[#1e3a5f] text-white rounded-xl px-6 py-2.5 text-sm font-medium hover:bg-[#2a5298] transition-colors"
          >
            Close
          </button>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

export default HelpModal;
